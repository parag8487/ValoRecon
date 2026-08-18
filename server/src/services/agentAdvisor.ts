export interface AgentRecommendation {
  agentName: string;
  role: 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel';
  tier: 'S' | 'A' | 'B';
  score: number;
  iconUrl: string;
  portraitUrl: string;
  mapAdvantage: string;
  synergyReasons: string[];
  keyAbilities: string[];
}

export interface CompAnalysis {
  hasController: boolean;
  hasInitiator: boolean;
  hasDuelist: boolean;
  hasSentinel: boolean;
  missingRoles: string[];
  compSummary: string;
  allyComp: string[];
  map: string;
}

export interface AgentAdvisorResult {
  recommendations: AgentRecommendation[];
  compAnalysis: CompAnalysis;
}

// Meta synergy database per map
const MAP_AGENT_META: Record<string, { S: string[]; A: string[]; mapTips: Record<string, string> }> = {
  Ascent: {
    S: ['Sova', 'Omen', 'Killjoy', 'Jett', 'KAY/O'],
    A: ['Fade', 'Astra', 'Cypher', 'Reyna', 'Clove'],
    mapTips: {
      Sova: 'Recon darts reveal entire B Main and A Site effortlessly through paper-thin walls.',
      Omen: 'One-way smokes on A Short and B Main shut down fast pushes.',
      Killjoy: 'Lockdown ultimate covers all of B Site for guaranteed retakes or executions.',
      Jett: 'Oping Mid on defense dominates map control.',
      'KAY/O': 'ZERO/point knife disables Killjoy lockdown and Sentinel setups across middle.'
    }
  },
  Bind: {
    S: ['Brimstone', 'Raze', 'Viper', 'Skye', 'Cypher'],
    A: ['Gekko', 'Fade', 'Omen', 'Yoru'],
    mapTips: {
      Brimstone: 'Triple-smoke execute on B Site or A Site completely blocks defenders.',
      Raze: 'Paint Shells and Boombot clear Hookah and U-Hall without face-checking.',
      Viper: 'Toxic Screen divides B Long and A Short efficiently.',
      Cypher: 'Trapwires in Hookah and B Long are nearly impossible to bypass silently.'
    }
  },
  Haven: {
    S: ['Sova', 'Omen', 'Breach', 'Killjoy', 'Jett'],
    A: ['Fade', 'Cypher', 'Clove', 'Reyna', 'Phoenix'],
    mapTips: {
      Sova: 'Info gathering across 3 bomb sites gives crucial early rotation signals.',
      Breach: 'Fault Line down A Long and C Long ruins defender opening peeks.',
      Omen: 'Global smokes provide fast support across A, B, and C sites.',
      Killjoy: 'Can solo-anchor C site while team stacks A and Garage.'
    }
  },
  Lotus: {
    S: ['Omen', 'Fade', 'Killjoy', 'Raze', 'Viper'],
    A: ['Clove', 'Breach', 'Cypher', 'Jett', 'Gekko'],
    mapTips: {
      Omen: 'Fast regenerating smokes cover all 3 sites and revolving doors.',
      Fade: 'Haunt on roof roofs detects B Site and C Site entries immediately.',
      Killjoy: 'Turret on C Mound covers early lurkers and flankers.'
    }
  },
  Sunset: {
    S: ['Cypher', 'Omen', 'Fade', 'Raze', 'Breach'],
    A: ['Sova', 'Clove', 'Jett', 'Viper', 'KAY/O'],
    mapTips: {
      Cypher: 'Unbreakable B Site setups make entering B Main a nightmare for attackers.',
      Omen: 'Mid courtyard smokes grant free control to Market and Top Mid.'
    }
  },
  Split: {
    S: ['Raze', 'Omen', 'Viper', 'Skye', 'Cypher'],
    A: ['Breach', 'Astra', 'Jett', 'Sage', 'Deadlock'],
    mapTips: {
      Raze: 'Nades and satchels are unmatched for controlling Mid vents and B Heaven.',
      Viper: 'Poison Cloud and Toxic Screen shut down B Main and Mid ropes.'
    }
  },
  Abyss: {
    S: ['Omen', 'Sova', 'Cypher', 'Jett', 'Breach'],
    A: ['Astra', 'Fade', 'KAY/O', 'Iso', 'Killjoy'],
    mapTips: {
      Omen: 'Verticality and teleports exploit drop-offs and bridge crossings.',
      Sova: 'Recon darts scan open pit areas and long sightlines.'
    }
  }
};

const AGENT_ROLES: Record<string, 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel'> = {
  Jett: 'Duelist',
  Reyna: 'Duelist',
  Raze: 'Duelist',
  Phoenix: 'Duelist',
  Yoru: 'Duelist',
  Neon: 'Duelist',
  Iso: 'Duelist',
  Omen: 'Controller',
  Brimstone: 'Controller',
  Viper: 'Controller',
  Astra: 'Controller',
  Harbor: 'Controller',
  Clove: 'Controller',
  Sova: 'Initiator',
  Fade: 'Initiator',
  Breach: 'Initiator',
  Skye: 'Initiator',
  'KAY/O': 'Initiator',
  Gekko: 'Initiator',
  Killjoy: 'Sentinel',
  Cypher: 'Sentinel',
  Sage: 'Sentinel',
  Chamber: 'Sentinel',
  Deadlock: 'Sentinel',
  Vyse: 'Sentinel'
};

export function recommendAgents(
  mapName: string,
  allyComp: string[] = [],
  preferredRole?: string,
  allAgentsList: any[] = []
): AgentAdvisorResult {
  const normMap = mapName || 'Ascent';
  const meta = MAP_AGENT_META[normMap] || MAP_AGENT_META['Ascent'];

  const existingRoles = allyComp.map((name) => AGENT_ROLES[name] || 'Duelist');
  const hasController = existingRoles.includes('Controller');
  const hasInitiator = existingRoles.includes('Initiator');
  const hasDuelist = existingRoles.includes('Duelist');
  const hasSentinel = existingRoles.includes('Sentinel');

  const missingRoles: string[] = [];
  if (!hasController) missingRoles.push('Controller');
  if (!hasInitiator) missingRoles.push('Initiator');
  if (!hasSentinel) missingRoles.push('Sentinel');
  if (!hasDuelist) missingRoles.push('Duelist');

  // Candidate pool
  const candidateNames = Object.keys(AGENT_ROLES).filter((name) => !allyComp.includes(name));

  const recommendations: AgentRecommendation[] = candidateNames.map((name) => {
    const role = AGENT_ROLES[name] || 'Duelist';
    let score = 70;
    let tier: 'S' | 'A' | 'B' = 'B';

    if (meta.S.includes(name)) {
      score += 20;
      tier = 'S';
    } else if (meta.A.includes(name)) {
      score += 12;
      tier = 'A';
    }

    // Role need bonus
    if (!hasController && role === 'Controller') score += 25;
    if (!hasInitiator && role === 'Initiator') score += 20;
    if (!hasSentinel && role === 'Sentinel') score += 18;
    if (!hasDuelist && role === 'Duelist') score += 15;

    // Preferred role bonus
    if (preferredRole && role.toLowerCase() === preferredRole.toLowerCase()) {
      score += 15;
    }

    const synergyReasons: string[] = [];
    if (!hasController && role === 'Controller') {
      synergyReasons.push('Critical team need: Fills missing Smokes/Controller role.');
    }
    if (!hasInitiator && role === 'Initiator') {
      synergyReasons.push('Vital info gatherer: Provides recon/flashes your team lacks.');
    }
    if (!hasSentinel && role === 'Sentinel') {
      synergyReasons.push('Flank lockdown: Anchors sites and prevents enemy lurks.');
    }
    if (meta.S.includes(name)) {
      synergyReasons.push(`Top-tier meta pick on ${normMap} with unmatched site execution.`);
    }

    const mapAdvantage = meta.mapTips[name] || `High effectiveness on ${normMap} geometry and sightlines.`;

    // Find agent icon from public assets or valorant-api
    const matched = allAgentsList.find((a) => a.displayName?.toLowerCase() === name.toLowerCase());
    const iconUrl = matched?.displayIcon || `https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png`;
    const portraitUrl = matched?.fullPortrait || matched?.displayIcon || '';

    const keyAbilities = (matched?.abilities || []).slice(0, 3).map((ab: any) => ab.displayName || ab.slot);

    return {
      agentName: name,
      role,
      tier,
      score: Math.min(score, 99),
      iconUrl,
      portraitUrl,
      mapAdvantage,
      synergyReasons,
      keyAbilities: keyAbilities.length > 0 ? keyAbilities : ['Signature Ability', 'Utility', 'Ultimate']
    };
  });

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  let compSummary = '';
  if (missingRoles.length === 0) {
    compSummary = 'Balanced 5-man composition with full role coverage.';
  } else {
    compSummary = `Composition is missing ${missingRoles.join(', ')}. Prioritize picking a ${missingRoles[0]} to maximize win probability.`;
  }

  return {
    recommendations: recommendations.slice(0, 6),
    compAnalysis: {
      hasController,
      hasInitiator,
      hasDuelist,
      hasSentinel,
      missingRoles,
      compSummary,
      allyComp,
      map: normMap
    }
  };
}
