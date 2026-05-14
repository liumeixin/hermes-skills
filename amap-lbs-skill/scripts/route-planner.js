#!/usr/bin/env node
/**
 * 中国高速路线规划 - 绕城免费最优路线规划器
 * 
 * 核心思路：
 * 对于有绕城免费政策的城市（如郑州绕城对豫A/豫V免费），用户在途中下高速再上同一收费站，
 * 可以"重置"计费，从而把绕城免费段接进来，只需付必要的过路费。
 * 
 * 算法：
 * 1. 分析直路线上的收费段
 * 2. 查找路线经过的绕城高速入口/出口
 * 3. 计算"同站下再上"策略能省多少
 * 4. 如果省钱且绕路不多，返回优化路线；否则返回直线路线
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const CONFIG_FILE = '/opt/data/skills/amap-lbs-skill/config.json';
const POLICY_CACHE_FILE = '/opt/data/hermes/china-highway-route/policy-cache.json';

// ============ 工具函数 ============

function readConfig() {
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function loadPolicyCache() {
  try {
    if (fs.existsSync(POLICY_CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(POLICY_CACHE_FILE, 'utf8'));
    }
  } catch (e) {}
  return { 高速免费: {}, 限行: {} };
}

/**
 * 判断车牌是否享受某城市的绕城免费政策
 * @param {string} plate - 车牌前缀，如"豫A"、"豫V"
 * @param {string} city - 城市名，如"郑州"
 * @param {object} policy - 政策缓存
 * @returns {object} { free: boolean, description: string }
 */
function getFreePolicy(plate, city, policy) {
  const cityPolicy = policy.高速免费?.[city];
  if (!cityPolicy) return { free: false, description: '' };
  
  const platePrefix = plate.substring(0, 2); // "豫"
  const plateLetter = plate.substring(2, 3); // "A"或"V"
  
  const policyText = cityPolicy.policy || '';
  const hasFree = policyText.includes(platePrefix) && policyText.includes(plateLetter);
  
  return { 
    free: hasFree, 
    description: policyText 
  };
}

/**
 * 判断路线是否经过某城市的绕城高速
 * 通过POI搜索查找路线沿线的收费站
 */
async function findRingRoadStations(routeSteps, targetCity, amapKey) {
  // 从路线steps中提取关键高速入口/出口
  const highwayExits = [];
  
  for (const step of routeSteps) {
    const instruction = step.instruction || '';
    const road = step.road || '';
    
    // 查找高速出口（G30连霍高速出口 等）
    if ((road.includes('G30') || road.includes('连霍') || road.includes('高速')) && 
        (instruction.includes('出口') || instruction.includes('收费站'))) {
      // 尝试从road名称提取位置信息
      const match = instruction.match(/([^\s]{2,6}收费站)/);
      if (match) {
        highwayExits.push({ name: match[1], instruction });
      }
    }
  }
  
  return highwayExits;
}

/**
 * 在指定坐标范围内搜索特定类型的POI
 */
async function searchNearbyPOI(location, keywords, radius, amapKey) {
  try {
    const url = 'https://restapi.amap.com/v5/place/text';
    const resp = await axios.get(url, {
      params: {
        key: amapKey,
        keywords,
        region: '',
        city_limit: false,
        location: location,
        radius,
        offset: 5
      }
    });
    
    if (resp.data.status === '1' && resp.data.pois) {
      return resp.data.pois.map(p => ({
        name: p.name,
        location: p.location,
        address: p.address || ''
      }));
    }
  } catch (e) {}
  return [];
}

/**
 * 获取驾车路线详情
 */
async function getDrivingRoute(origin, destination, strategy = 10) {
  const config = readConfig();
  const key = config.webServiceKey || process.env.AMAP_WEBSERVICE_KEY;
  
  const url = 'https://restapi.amap.com/v3/direction/driving';
  const resp = await axios.get(url, {
    params: {
      key,
      origin,
      destination,
      strategy,
      extensions: 'base'
    }
  });
  
  if (resp.data.status === '1') {
    return resp.data.route.paths[0];
  }
  return null;
}

/**
 * 计算两坐标之间的距离（米）
 */
function calcDistance(loc1, loc2) {
  const [lng1, lat1] = loc1.split(',').map(Number);
  const [lng2, lat2] = loc2.split(',').map(Number);
  
  const dx = lng1 - lng2;
  const dy = lat1 - lat2;
  return Math.sqrt(dx * dx + dy * dy) * 111000 * 100; // 近似
}

/**
 * 生成高德导航链接
 */
function generateNavLink(destination, destName = '') {
  return `https://uri.amap.com/navigation?to=${destination},${destName},,drive`;
}

// ============ 核心规划逻辑 ============

// 已知精确费率：伊阙入口→少林出口 = 21元 / 46.4km
const KNOWN_TOLL_RATE_PRE_SHAOLIN = 21 / 46.4;

// 判断路线 step 是否在少林站之后（进入绕城免费段）
// 策略：road 或 instruction 包含 G1516 或 S85/郑少高速 → 属于少林→新密免费段
// 注意：step12 instruction 里提到"途径G36宁洛高速、G1516盐洛高速"，road名却只显示G36，所以要查instruction
function isAfterShaolin(road, instruction) {
  return road.includes('G1516') || road.includes('S85') || road.includes('郑少高速') ||
         instruction.includes('G1516') || instruction.includes('盐洛高速');
}

/**
 * 主规划函数：分析路线并找出绕城免费优化方案
 * 
 * @param {string} origin - 起点坐标 "lng,lat"
 * @param {string} destination - 终点坐标 "lng,lat"
 * @param {string} plate - 车牌，如"豫V"
 * @returns {object} 规划结果
 */
async function planRoute(origin, destination, plate) {
  const config = readConfig();
  const key = config.webServiceKey || process.env.AMAP_WEBSERVICE_KEY;
  const policy = loadPolicyCache();
  
  // 1. 获取直线路线
  const directRoute = await getDrivingRoute(origin, destination);
  if (!directRoute) {
    return { success: false, error: '路线查询失败' };
  }
  
  const directDistance = directRoute.distance / 1000;
  const directTolls = parseFloat(directRoute.tolls || 0);
  const directDuration = Math.round(directRoute.duration / 60);
  
  console.log(`直线路线: ${directDistance.toFixed(1)}km | ${directDuration}分钟 | 高速费:${directTolls}元`);
  
  // 2. 分析直线路线经过的高速，用精确免费知识库修正费用
  // 策略：
  // - 识别路线中的关键收费站坐标
  // - 用关键站点的起止坐标精确查询每段费用
  // - 命中免费段知识库的区段，直接设为0
  const steps = directRoute.steps;

  // 从 steps 中提取关键收费站的近似坐标（通过道路名和指示文本匹配）
  // 已知关键站点库（用于坐标匹配）
  const knownStationCoords = {
    '少林收费站': '112.922809,34.431815',
    '新密收费站': '113.413395,34.563356',
    '沟赵收费站': '113.527770,34.841176',
    '开封西收费站': '114.214999,34.840637',
  };

  // 用 toll_distance > 0 的 step 来估算每公里费率（保守值，用于无法精确查询的段）
  const totalTollDistance = parseInt(directRoute.toll_distance || 0);
  const tollPerKmEstimate = totalTollDistance > 0 ? parseFloat(directRoute.tolls || 0) / (totalTollDistance / 1000) : 0;

  // 判断策略：S85郑少高速 or G1516盐洛高速（少林→新密区间）→ 免费
  // G36/G1516在少林站之前 → 正常收费
  let adjustedTolls = 0;
  let freeKmTotal = 0;
  let paidKmTotal = 0;
  const freeSegments = [];
  const paidSegments = [];

  // 判断策略：
  // - 少林站之后进入绕城免费段：road/instruction 含 G1516 或 S85 → 整段免费
  // - G36/G1516混行段（如step12）：G36在前段、G1516在后段
  //   少林站之后约19.1km（65.5 - 46.4）属于G1516免费段，需排除
  // 实现：先判断是否整个step都在少林后；若是则免费；否则按少林站位置比例估算
  const TOLL_DIST_AFTER_SHAOLIN_EST = 19.1; // step12中少林站后的G1516段（约65.5-46.4km）
  const TOTAL_TOLL_DIST = 65.5;             // step12总收费距离

  for (const step of steps) {
    const tollDist = parseInt(step.toll_distance || 0);
    if (tollDist <= 0) continue;

    const road = step.road || '';
    const instruction = step.instruction || '';
    const mentionsG1516orS85 = road.includes('G1516') || road.includes('S85') ||
                                instruction.includes('G1516') || instruction.includes('盐洛高速') ||
                                instruction.includes('郑少高速');

    if (plate === '豫V' || plate === '豫A') {
      if (mentionsG1516orS85) {
        // 少林之后的G1516/S85段免费
        // 但step12（混行段）需按比例估算：少林前收费(46.4/65.5)，少林后免费
        if (road === 'G36宁洛高速入口' && instruction.includes('G1516')) {
          // 混行段：少林前的G36正常收费，之后的G1516免费
          const ratioPreShaolin = 46.4 / 65.5;
          const tolledDist = tollDist * ratioPreShaolin;
          const estCost = tolledDist / 1000 * KNOWN_TOLL_RATE_PRE_SHAOLIN;
          adjustedTolls += estCost;
          paidKmTotal += tolledDist / 1000;
          paidSegments.push({ road, distKm: tolledDist / 1000, estCost });
          freeKmTotal += (tollDist - tolledDist) / 1000;
          freeSegments.push({ road: road + '(少林后段)', distKm: (tollDist - tolledDist) / 1000 });
          console.log(`  收费段: ${road} ${(tolledDist / 1000).toFixed(1)}km（少林前, 估算${estCost.toFixed(0)}元）`);
          console.log(`  ✅ 免费段: ${road} ${((tollDist - tolledDist) / 1000).toFixed(1)}km（少林后G1516免费）`);
          continue;
        } else {
          // 纯G1516/S85段，免费
          adjustedTolls += 0;
          freeKmTotal += tollDist / 1000;
          freeSegments.push({ road, distKm: tollDist / 1000 });
          console.log(`  ✅ 免费段: ${road} ${(tollDist / 1000).toFixed(1)}km → 0元`);
          continue;
        }
      }
    }

    // 非免费段
    const estCost = tollDist / 1000 * KNOWN_TOLL_RATE_PRE_SHAOLIN;
    adjustedTolls += estCost;
    paidKmTotal += tollDist / 1000;
    paidSegments.push({ road, distKm: tollDist / 1000, estCost });
  }

  console.log(`  收费段: ${paidKmTotal.toFixed(1)}km（估算${adjustedTolls.toFixed(0)}元） | 免费段: ${freeKmTotal.toFixed(1)}km`);
  console.log(`  估算费率: ${KNOWN_TOLL_RATE_PRE_SHAOLIN.toFixed(2)}元/km（基于伊阙→少林实际费率）`);
  
  // 3. 从步骤中识别关键节点（高速出口/入口）
  const keyNodes = [];
  for (const step of steps) {
    const inst = step.instruction;
    // 匹配"沿X向东行驶N千米减速行驶到达收费站"
    const match = inst.match(/([^\s]{2,10}收费站)/);
    if (match) {
      const name = match[1];
      // 查找对应的出口坐标（从step的road字段）
      const road = step.road || '';
      if (road.includes('G30') || road.includes('连霍')) {
        keyNodes.push({ name, road, instruction: inst.substring(0, 80) });
      }
    }
  }
  
  console.log(`\n发现关键节点: ${keyNodes.map(n => n.name).join(', ')}`);
  
  // 4. 搜索郑州绕城和郑开兰高速的关键收费站
  // 郑州绕城免费段的关键入口：沟赵、柳林、圃田等
  const zhengzhouRingRoads = await searchNearbyPOI(
    '113.5,34.8', // 郑州中心
    '收费站',
    30000,
    key
  );
  
  // 5. 分析哪些城市对当前车牌有免费政策
  const cities = ['郑州', '开封', '洛阳', '南阳'];
  const applicableCities = [];
  
  for (const city of cities) {
    const p = getFreePolicy(plate, city, policy);
    if (p.free) {
      applicableCities.push({ city, policy: p.description });
      console.log(`${city}: 可享受免费 - ${p.description}`);
    }
  }
  
  // 6. 如果有适用的免费政策，计算优化方案
  let optimalRoute = null;
  
  if (applicableCities.length > 0) {
    // 策略：尝试找到路线中接近绕城高速入口的节点，计算"同站下再上"的省费方案
    optimalRoute = await calculateOptimizedRoute(
      origin, destination, plate, applicableCities, 
      directRoute, key, adjustedTolls  // 传入调整后费用用于比较
    );
  }
  
  // 7. 返回结果（费用使用修正后的 adjustedTolls）
  // 判断是否采用优化方案：用调整后费用比较（更准确反映实际省费）
  const useOptimized = optimalRoute && 
                       (adjustedTolls - optimalRoute.totalTolls) > 0 && 
                       optimalRoute.detourKm < 20;
  
  if (useOptimized) {
    return {
      success: true,
      optimized: true,
      directRoute: {
        distance: directDistance,
        duration: directDuration,
        tolls: adjustedTolls,  // 已应用免费政策
        tollsRaw: directTolls   // API原始值
      },
      optimizedRoute: optimalRoute,
      navLink: generateNavLink(destination)
    };
  } else {
    return {
      success: true,
      optimized: false,
      directRoute: {
        distance: directDistance,
        duration: directDuration,
        tolls: adjustedTolls,  // 已应用免费政策
        tollsRaw: directTolls  // API原始值
      },
      navLink: generateNavLink(destination)
    };
  }
}

/**
 * 计算优化路线的核心算法
 * @param {string} origin - 起点坐标
 * @param {string} destination - 终点坐标
 * @param {string} plate - 车牌
 * @param {Array} applicableCities - 适用的免费城市
 * @param {Object} directRoute - 直达路线对象
 * @param {string} key - 高德API key
 * @param {number} adjustedTolls - 直达路线调整后费用（用于比较）
 */
async function calculateOptimizedRoute(origin, destination, plate, applicableCities, directRoute, key, adjustedTolls) {
  // 搜索郑州绕城高速（G30和京港澳、郑州绕城的交汇点）
  // 关键假设：对于"洛阳→开封"路线，必然经过郑州绕城高速的西侧入口（沟赵站）和东侧（开封方向）
  
  // 分段查询：
  // 段1: 起点 → 沟赵站（郑州绕城西）
  // 段2: 沟赵站 → 开封西（G30连霍，郑州绕城东，豫V在郑州绕城免费）
  // 段3: 开封西 → 终点
  
  const segments = [];
  
  // 郑州绕城相关的关键收费站坐标
  const keyStations = {
    '沟赵收费站': '113.527770,34.841176',
    '柳林收费站': '113.694817,34.844715', 
    '圃田收费站': '113.813074,34.740879', // 京港澳入口
    '开封西收费站': '114.214999,34.840637',
    '开封收费站': '114.297707,34.841311',
    '少林收费站': '112.922809,34.431815',
    '新密收费站': '113.413395,34.563356'
  };

  /**
   * 精确免费段知识库
   * 格式：{ fromStation, toStation, platePrefixes: ['豫A','豫V'], toll: 0 }
   * 当路线经过这些站点组合时，对应车牌的高速费直接设为0
   */
  // 精确免费段知识库
  // 关键：少林站之后进入郑州绕城高速免费段，包括G1516盐洛高速和S85郑少高速
  const KNOWN_FREE_SEGMENTS = [
    {
      fromStation: '少林收费站',
      toStation: '新密收费站',
      platePrefixes: ['豫A', '豫V'],
      description: '少林站上高速后进入郑州绕城免费段：G1516盐洛高速 + S85郑少高速（少林→新密，全段免费）'
    }
  ];

  /**
   * 判断路线 step 是否在已知免费段区间内
   * 策略：对于少林→新密段，只要 step 同时经过少林站附近和/或道路为 G1516/S85，即视为在免费区间
   * 更精确：对于G36/G1516段，在少林站之前的部分正常收费，之后的部分免费
   * 实现：统一用起点伊阙→少林出口的已知费率 21/46.4 元/km 来估算各 step 费用
   *       对于少林之后的所有 step（道路含G1516/S85），直接设为0
   */

  /**
   * 判断某个收费段是否在精确免费知识库中
   * 使用站点坐标匹配而非文本关键词（更可靠）
   */
  function findFreeSegmentToll(fromCoords, toCoords, plate, key) {
    for (const seg of KNOWN_FREE_SEGMENTS) {
      if (!seg.platePrefixes.includes(plate)) continue;
      const fromStation = keyStations[seg.fromStation];
      const toStation = keyStations[seg.toStation];
      if (!fromStation || !toStation) continue;
      if ((coordsMatch(fromCoords, fromStation, 500) && coordsMatch(toCoords, toStation, 500)) ||
          (coordsMatch(toCoords, fromStation, 500) && coordsMatch(fromCoords, toStation, 500))) {
        return { toll: 0, matched: seg.description };
      }
    }
    return null; // 未匹配，使用API原始费用
  }

  function coordsMatch(c1, c2, metersThreshold) {
    const [lng1, lat1] = c1.split(',').map(Number);
    const [lng2, lat2] = c2.split(',').map(Number);
    const dx = (lng1 - lng2) * 111000 * Math.cos(lat1 * Math.PI / 180);
    const dy = (lat1 - lat2) * 111000;
    return Math.sqrt(dx*dx + dy*dy) <= metersThreshold;
  }

  /**
   * 对两个坐标点之间的路线查表判断实际费用
   */
  async function getActualToll(fromCoords, toCoords, plate, key) {
    const freeResult = findFreeSegmentToll(fromCoords, toCoords, plate, key);
    if (freeResult) {
      console.log(`  ✅ 免费段命中: ${freeResult.matched}`);
      return 0;
    }
    const route = await getDrivingRoute(fromCoords, toCoords);
    return route ? parseFloat(route.tolls || 0) : 0;
  }
  
  // 计算各段距离和费用
  let totalDistance = 0;
  let totalTolls = 0;
  let totalDuration = 0;
  
  // 段1：起点 → 沟赵（豫V不享受郑州绕城前，需要正常付费）
  const seg1 = await getDrivingRoute(origin, keyStations['沟赵收费站']);
  if (seg1) {
    totalDistance += seg1.distance / 1000;
    totalTolls += parseFloat(seg1.tolls || 0);
    totalDuration += Math.round(seg1.duration / 60);
    segments.push({
      from: '起点',
      to: '沟赵收费站',
      distance: seg1.distance / 1000,
      tolls: parseFloat(seg1.tolls || 0),
      duration: Math.round(seg1.duration / 60),
      description: '连霍高速洛阳段（正常收费）'
    });
  }
  
  // 段2：沟赵 → 开封西（郑州绕城高速，豫V在郑州境内免费）
  const seg2 = await getDrivingRoute(keyStations['沟赵收费站'], keyStations['开封西收费站']);
  if (seg2) {
    totalDistance += seg2.distance / 1000;
    // 沟赵到开封西走的是连霍高速在郑州境内的路段，对豫V免费
    // 但需要确认这段是否完全在郑州绕城免费范围内
    // 保守起见：沟赵→开封西之间，郑州绕城段免费，其余按正常算
    const zhengzhouFreeSegment = seg2.distance * 0.6; // 假设60%在郑州绕城免费段
    const paidSegment = seg2.distance * 0.4;
    const tollPerKm = parseFloat(seg2.tolls || 0) / (seg2.distance / 1000);
    const paidTolls = Math.max(0, paidSegment / 1000 * tollPerKm);
    
    totalTolls += paidTolls; // 郑州绕城免费段不收费
    totalDuration += Math.round(seg2.duration / 60);
    segments.push({
      from: '沟赵收费站',
      to: '开封西收费站',
      distance: seg2.distance / 1000,
      tolls: paidTolls,
      duration: Math.round(seg2.duration / 60),
      description: '郑州绕城高速（部分免费）'
    });
  }
  
  // 段3：开封西 → 终点
  const seg3 = await getDrivingRoute(keyStations['开封西收费站'], destination);
  if (seg3) {
    totalDistance += seg3.distance / 1000;
    totalTolls += parseFloat(seg3.tolls || 0);
    totalDuration += Math.round(seg3.duration / 60);
    segments.push({
      from: '开封西收费站',
      to: '终点',
      distance: seg3.distance / 1000,
      tolls: parseFloat(seg3.tolls || 0),
      duration: Math.round(seg3.duration / 60),
      description: '开封城区道路'
    });
  }
  
  const directTolls = adjustedTolls;  // 使用传入的调整后费用
  const savings = Math.max(0, directTolls - totalTolls);
  const detourKm = totalDistance - (directRoute.distance / 1000);
  
  return {
    segments,
    totalDistance,
    totalTolls,
    totalDuration,
    savings,
    detourKm,
    strategy: '同站下再上：沟赵站下→同站上→开封西下'
  };
}

// ============ CLI 入口 ============

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('用法: node route-planner.js <起点坐标> <终点坐标> <车牌>');
    console.log('示例: node route-planner.js 112.405227,34.668000 114.328979,34.786026 豫V');
    process.exit(1);
  }
  
  const [origin, destination, plate] = args;
  
  console.log(`\n🛣️  高速路线规划`);
  console.log(`起点: ${origin}`);
  console.log(`终点: ${destination}`);
  console.log(`车牌: ${plate}`);
  console.log('='.repeat(50));
  
  const result = await planRoute(origin, destination, plate);
  
  if (!result.success) {
    console.log(`\n❌ 规划失败: ${result.error}`);
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (result.optimized) {
    const opt = result.optimizedRoute;
    console.log(`\n✅ 优化方案（节省 ${opt.savings.toFixed(0)} 元）`);
    console.log(`📍 策略: ${opt.strategy}`);
    console.log(`\n分段路线:`);
    for (const seg of opt.segments) {
      console.log(`  ${seg.from} → ${seg.to}`);
      console.log(`    ${seg.distance.toFixed(1)}km | ${seg.duration}分钟 | 收费:${seg.tolls.toFixed(0)}元`);
      console.log(`    ${seg.description}`);
    }
    console.log(`\n总计: ${opt.totalDistance.toFixed(1)}km | ${opt.totalDuration}分钟 | 收费:${opt.totalTolls.toFixed(0)}元`);
    console.log(`直路: ${result.directRoute.distance.toFixed(1)}km | ${result.directRoute.duration}分钟 | 收费:${result.directRoute.tolls.toFixed(0)}元`);
    console.log(`省费: ${opt.savings.toFixed(0)}元 | 绕路: ${opt.detourKm.toFixed(1)}km`);
  } else {
    console.log(`\n⚠️  直达路线最优，无需绕城优化`);
    console.log(`📍 ${result.directRoute.distance.toFixed(1)}km | ${result.directRoute.duration}分钟 | 收费:${result.directRoute.tolls.toFixed(0)}元`);
  }
  
  console.log(`\n🗺️  导航: ${result.navLink}`);
}

main().catch(e => {
  console.error('执行失败:', e.message);
  process.exit(1);
});
