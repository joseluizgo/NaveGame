/**
 * Level Configurations and Progression Data
 * Defines 4 distinct, extensive levels with unique environments, safe exploration zones,
 * lore data-pads, resource caches, environmental hazards, gates, and trigger-based zombie encounters.
 */

export const LEVEL_CONFIGS = {
  1: {
    id: 1,
    name: "Subúrbios Abandonados",
    subtitle: "Ato I: O Silêncio e a Quarentena",
    trackLength: 540,
    trackWidth: 11.2,
    safeExplorationDistance: 215, // first 215m completely free of enemies!
    atmosphere: {
      skyColor: 0x090e17,
      fogDensity: 0.009,
      lightColor: 0x60a5fa,
      lightIntensity: 1.8,
      groundColor: 0x070b14,
      themeName: "suburbs"
    },
    loreDataPads: [
      {
        z: -45,
        x: -2.2,
        title: "DIÁRIO DE SOBREVIVENTE #01",
        text: "O alerta de evacuação soou às 04h... A barreira norte caiu primeiro. Peguei o que pude do abrigo e segui pela avenida principal. O silêncio por aqui é perturbador."
      },
      {
        z: -160,
        x: 2.4,
        title: "DIÁRIO DE SOBREVIVENTE #02",
        text: "Encontrei rastros estranhos no asfalto além do viaduto. Se houver infectados mais à frente, eles parecem estar adormecidos ou desorientados. Preciso manter a arma carregada."
      }
    ],
    pickups: [
      { type: 'medkit', z: -70, x: 2.0, heal: 35 },
      { type: 'ammo', z: -110, x: -2.0, ammo: 60 },
      { type: 'coins', z: -185, x: 0, coins: 35 },
      { type: 'ammo', z: -270, x: 2.5, ammo: 60 },
      { type: 'medkit', z: -350, x: -2.5, heal: 35 }
    ],
    hazards: [
      { type: 'barricade', z: -130, x: 2.2, width: 2.8, hp: 15 },
      { type: 'spikes', z: -200, x: -2.0, width: 3.0 }
    ],
    gates: [
      {
        z: -140,
        left: { type: 'add', value: 15, isPositive: true },
        right: { type: 'multiply', value: 2, isPositive: true }
      },
      {
        z: -280,
        left: { type: 'multiply', value: 2, isPositive: true },
        right: { type: 'sub', value: 8, isPositive: false }
      },
      {
        z: -390,
        left: { type: 'add', value: 25, isPositive: true },
        right: { type: 'multiply', value: 3, isPositive: true }
      }
    ],
    // Trigger-based enemy encounters (triggered when player crosses triggerZ)
    triggers: [
      {
        id: 'l1_ambush_1',
        triggerZ: -225,
        spawnZ: -260,
        type: 'walker',
        count: 2,
        formation: 'pair',
        alertText: "⚠️ MOVIMENTO DETECTADO À FRENTE!"
      },
      {
        id: 'l1_ambush_2',
        triggerZ: -310,
        spawnZ: -345,
        type: 'walker',
        count: 4,
        formation: 'line'
      },
      {
        id: 'l1_ambush_3',
        triggerZ: -420,
        spawnZ: -455,
        type: 'walker',
        count: 6,
        formation: 'v-shape'
      },
      {
        id: 'l1_boss',
        triggerZ: -475,
        spawnZ: -505,
        type: 'boss',
        formation: 'boss',
        alertText: "⚠️ BRUTO MUTANTE NO HORIZONTE!"
      }
    ]
  },

  2: {
    id: 2,
    name: "Via Expressa Tóxica",
    subtitle: "Ato II: A Infecção se Alastra",
    trackLength: 740,
    trackWidth: 12.0,
    safeExplorationDistance: 190, // first 190m free of enemies
    atmosphere: {
      skyColor: 0x051a10,
      fogDensity: 0.012,
      lightColor: 0x34d399,
      lightIntensity: 1.6,
      groundColor: 0x03120b,
      themeName: "toxic"
    },
    loreDataPads: [
      {
        z: -50,
        x: -2.5,
        title: "RELATÓRIO QUÍMICO #08",
        text: "Vazamento severo do composto Neuro-VX na refinaria. A fumaça esverdeada acelerou o sistema motor dos zumbis! Espécimes conhecidos como 'Corredores' investem em alta velocidade."
      },
      {
        z: -170,
        x: 2.2,
        title: "TRANSMISSÃO DE RADIOAMADOR",
        text: "Se alguém estiver ouvindo na frequência 94.2: evite as poças químicas na pista! Elas corroem a blindagem do veículo instantaneamente."
      }
    ],
    pickups: [
      { type: 'ammo', z: -65, x: 2.2, ammo: 60 },
      { type: 'medkit', z: -105, x: -2.2, heal: 35 },
      { type: 'coins', z: -150, x: 0, coins: 45 },
      { type: 'ammo', z: -250, x: -2.5, ammo: 70 },
      { type: 'medkit', z: -380, x: 2.5, heal: 40 },
      { type: 'ammo', z: -520, x: -2.0, ammo: 70 }
    ],
    hazards: [
      { type: 'toxic_pool', z: -85, x: 0, width: 3.5 },
      { type: 'barricade', z: -140, x: -2.4, width: 2.6, hp: 20 },
      { type: 'toxic_pool', z: -230, x: 2.2, width: 3.0 },
      { type: 'barricade', z: -340, x: 0, width: 3.2, hp: 25 },
      { type: 'toxic_pool', z: -480, x: -2.0, width: 3.2 }
    ],
    gates: [
      {
        z: -120,
        left: { type: 'multiply', value: 2, isPositive: true },
        right: { type: 'add', value: 20, isPositive: true }
      },
      {
        z: -270,
        left: { type: 'div', value: 2, isPositive: false },
        right: { type: 'multiply', value: 3, isPositive: true }
      },
      {
        z: -420,
        left: { type: 'add', value: 30, isPositive: true },
        right: { type: 'multiply', value: 2, isPositive: true }
      },
      {
        z: -580,
        left: { type: 'multiply', value: 3, isPositive: true },
        right: { type: 'sub', value: 12, isPositive: false }
      }
    ],
    triggers: [
      {
        id: 'l2_runners_intro',
        triggerZ: -200,
        spawnZ: -240,
        type: 'runner',
        count: 2,
        formation: 'pair',
        alertText: "⚠️ VELOCIDADE ANORMAL! ZUMBIS CORREDORES!"
      },
      {
        id: 'l2_pack_1',
        triggerZ: -300,
        spawnZ: -335,
        type: 'mixed_runner', // 2 runners + 2 walkers
        count: 4,
        formation: 'line'
      },
      {
        id: 'l2_pack_2',
        triggerZ: -450,
        spawnZ: -490,
        type: 'mixed_runner',
        count: 6,
        formation: 'v-shape'
      },
      {
        id: 'l2_horde_dense',
        triggerZ: -590,
        spawnZ: -630,
        type: 'walker',
        count: 8,
        formation: 'grid'
      },
      {
        id: 'l2_boss',
        triggerZ: -680,
        spawnZ: -710,
        type: 'toxic_boss',
        formation: 'boss',
        alertText: "⚠️ HORROR QUÍMICO DETECTADO!"
      }
    ]
  },

  3: {
    id: 3,
    name: "Setor Subterrâneo 7",
    subtitle: "Ato III: O Labirinto Industrial",
    trackLength: 940,
    trackWidth: 13.5,
    safeExplorationDistance: 180, // first 180m free of enemies
    atmosphere: {
      skyColor: 0x1a060a,
      fogDensity: 0.011,
      lightColor: 0xf87171,
      lightIntensity: 1.7,
      groundColor: 0x120306,
      themeName: "industrial"
    },
    loreDataPads: [
      {
        z: -40,
        x: 2.8,
        title: "TERMINAL INDUSTRIAL - SETOR 7",
        text: "ALERTA MÁXIMO DE CONTENÇÃO. As portas anti-blast foram lacradas para confinar as cobaias com exoesqueletos militares. As patrulhas mecânicas agora varrem os corredores cegamente."
      },
      {
        z: -150,
        x: -2.8,
        title: "LOG DE ENGENHARIA DE COMBATE",
        text: "Os zumbis com capacetes e blindagem corporal (Tanques Blindados) não caem com tiros fracos. Mire concentrado ou use portões multiplicadores para perfurar as chapas de aço."
      }
    ],
    pickups: [
      { type: 'medkit', z: -60, x: -2.5, heal: 40 },
      { type: 'ammo', z: -95, x: 2.5, ammo: 80 },
      { type: 'coins', z: -140, x: 0, coins: 50 },
      { type: 'medkit', z: -290, x: 3.0, heal: 40 },
      { type: 'ammo', z: -430, x: -3.0, ammo: 90 },
      { type: 'medkit', z: -620, x: 0, heal: 50 },
      { type: 'ammo', z: -760, x: 2.5, ammo: 90 }
    ],
    hazards: [
      // Labirinto com divisórias de concreto centrais e laterais
      { type: 'concrete_wall', z: -90, x: 0, width: 1.2, depth: 35 }, // central wall dividing lane
      { type: 'spikes', z: -130, x: -3.0, width: 2.8 },
      { type: 'concrete_wall', z: -250, x: -2.2, width: 1.2, depth: 40 },
      { type: 'barricade', z: -320, x: 2.5, width: 3.0, hp: 30 },
      { type: 'concrete_wall', z: -460, x: 2.0, width: 1.2, depth: 45 },
      { type: 'toxic_pool', z: -540, x: -2.5, width: 3.5 },
      { type: 'concrete_wall', z: -700, x: 0, width: 1.2, depth: 40 },
      { type: 'barricade', z: -780, x: -2.8, width: 3.2, hp: 35 }
    ],
    gates: [
      {
        z: -110,
        left: { type: 'multiply', value: 2, isPositive: true },
        right: { type: 'add', value: 25, isPositive: true }
      },
      {
        z: -270,
        left: { type: 'multiply', value: 3, isPositive: true },
        right: { type: 'div', value: 2, isPositive: false }
      },
      {
        z: -480,
        left: { type: 'add', value: 35, isPositive: true },
        right: { type: 'multiply', value: 3, isPositive: true }
      },
      {
        z: -680,
        left: { type: 'multiply', value: 2, isPositive: true },
        right: { type: 'sub', value: 15, isPositive: false }
      },
      {
        z: -820,
        left: { type: 'multiply', value: 4, isPositive: true },
        right: { type: 'add', value: 40, isPositive: true }
      }
    ],
    triggers: [
      {
        id: 'l3_patrol_intro',
        triggerZ: -190,
        spawnZ: -230,
        type: 'patroller',
        count: 2,
        formation: 'pair',
        alertText: "⚠️ PATRULHEIROS TÁTICOS EM MOVIMENTO LATERAL!"
      },
      {
        id: 'l3_armored_intro',
        triggerZ: -330,
        spawnZ: -370,
        type: 'armored',
        count: 3,
        formation: 'line',
        alertText: "⚠️ ZUMBIS BLINDADOS COM CAPACETE DETECTADOS!"
      },
      {
        id: 'l3_maze_ambush',
        triggerZ: -510,
        spawnZ: -550,
        type: 'patroller',
        count: 4,
        formation: 'flank'
      },
      {
        id: 'l3_mixed_horde',
        triggerZ: -710,
        spawnZ: -750,
        type: 'mixed_heavy', // armored + runners
        count: 8,
        formation: 'grid'
      },
      {
        id: 'l3_boss',
        triggerZ: -870,
        spawnZ: -905,
        type: 'armored_boss',
        formation: 'boss',
        alertText: "⚠️ CAPITÃO CIBERNÉTICO BLINDADO!"
      }
    ]
  },

  4: {
    id: 4,
    name: "A Cidadela & A Grande Fuga",
    subtitle: "Ato IV: O Clímax Apocalíptico",
    trackLength: 1180,
    trackWidth: 14.5,
    safeExplorationDistance: 165, // first 165m calm before the storm
    atmosphere: {
      skyColor: 0x140520,
      fogDensity: 0.010,
      lightColor: 0xc084fc,
      lightIntensity: 2.0,
      groundColor: 0x090212,
      themeName: "citadel"
    },
    loreDataPads: [
      {
        z: -50,
        x: 0,
        title: "COMUNICADO DE EXTRAÇÃO MILITAR",
        text: "A TODOS OS SOBREVIVENTES: O helicóptero de resgate Alpha-1 está em pouso de emergência no fim da passarela da Cidadela! O Titã Colossal rompeu o muro de isolamento. Destrua-o e fuja imediatamente!"
      },
      {
        z: -140,
        x: -3.0,
        title: "ÚLTIMO REGISTRO DE COMBATE",
        text: "Esta é a linha final. O estoque de plasma foi totalmente liberado. Pegue toda munição que puder nesta área segura antes que a sirene soe!"
      }
    ],
    pickups: [
      { type: 'medkit', z: -40, x: -2.8, heal: 50 },
      { type: 'ammo', z: -70, x: 2.8, ammo: 100 },
      { type: 'medkit', z: -110, x: 2.8, heal: 50 },
      { type: 'ammo', z: -130, x: -2.8, ammo: 100 },
      { type: 'coins', z: -150, x: 0, coins: 80 },
      { type: 'ammo', z: -320, x: 3.0, ammo: 100 },
      { type: 'medkit', z: -460, x: -3.0, heal: 50 },
      { type: 'ammo', z: -640, x: 0, ammo: 100 },
      { type: 'medkit', z: -800, x: 3.0, heal: 50 },
      { type: 'ammo', z: -920, x: -3.0, ammo: 120 }
    ],
    hazards: [
      { type: 'barricade', z: -125, x: 0, width: 3.5, hp: 20 },
      { type: 'toxic_pool', z: -260, x: -2.5, width: 3.5 },
      { type: 'concrete_wall', z: -370, x: 0, width: 1.5, depth: 40 },
      { type: 'spikes', z: -440, x: 3.0, width: 3.5 },
      { type: 'barricade', z: -580, x: -2.5, width: 3.5, hp: 40 },
      { type: 'toxic_pool', z: -720, x: 2.5, width: 4.0 },
      { type: 'spikes', z: -850, x: 0, width: 4.0 }
    ],
    gates: [
      {
        z: -100,
        left: { type: 'multiply', value: 2, isPositive: true },
        right: { type: 'add', value: 30, isPositive: true }
      },
      {
        z: -280,
        left: { type: 'multiply', value: 3, isPositive: true },
        right: { type: 'add', value: 40, isPositive: true }
      },
      {
        z: -490,
        left: { type: 'multiply', value: 4, isPositive: true },
        right: { type: 'div', value: 2, isPositive: false }
      },
      {
        z: -700,
        left: { type: 'add', value: 50, isPositive: true },
        right: { type: 'multiply', value: 3, isPositive: true }
      },
      {
        z: -890,
        left: { type: 'multiply', value: 5, isPositive: true },
        right: { type: 'multiply', value: 4, isPositive: true }
      }
    ],
    triggers: [
      {
        id: 'l4_siren_alarm',
        triggerZ: -175,
        spawnZ: -215,
        type: 'runner',
        count: 4,
        formation: 'flank',
        alertText: "🚨 SIRENE DE EXTRAÇÃO ATIVADA! HORDA APROXIMANDO-SE!"
      },
      {
        id: 'l4_wave_patrollers',
        triggerZ: -330,
        spawnZ: -375,
        type: 'patroller',
        count: 5,
        formation: 'line'
      },
      {
        id: 'l4_heavy_cluster',
        triggerZ: -530,
        spawnZ: -575,
        type: 'mixed_heavy',
        count: 10,
        formation: 'grid'
      },
      {
        id: 'l4_runners_blitz',
        triggerZ: -740,
        spawnZ: -785,
        type: 'runner',
        count: 8,
        formation: 'v-shape'
      },
      {
        id: 'l4_titan_boss',
        triggerZ: -940,
        spawnZ: -985,
        type: 'titan_boss',
        formation: 'boss',
        alertText: "💀 O TITÃ COLOSSAL DESPERTOU! DESTRUA-O PARA ESCAPAR!"
      },
      {
        id: 'l4_final_escape',
        triggerZ: -1010,
        spawnZ: -1060,
        type: 'escape_rush',
        count: 6,
        formation: 'flank',
        alertText: "🚁 CORRA PARA O HELICÓPTERO DE RESGATE!"
      }
    ]
  }
};

