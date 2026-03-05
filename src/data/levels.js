export const LEVEL_CONFIG = {
    1: {
        title: "THE GARDEN: FLY INFESTATION",
        spawns: [
            { type: 'FLY', count: 5 }
        ]
    },
    2: {
        title: "THE GARDEN: RAT PROBLEM",
        spawns: [
            { type: 'RAT', count: 6 }
        ]
    },
    3: {
        title: "THE GARDEN: CAT PATROL",
        spawns: [
            { type: 'CAT', count: 4 }
        ]
    },
    4: {
        title: "THE GARDEN: ANTI-GOOSE",
        spawns: [
            { type: 'ANTI_GOOSE', count: 1 }
        ]
    },
    5: {
        title: "BOSS: THE GARDENER",
        spawns: [
            { type: 'GARDENER', count: 1 }
        ]
    },
    6: {
        title: "THE BACKYARD: TOAD SPRINGS",
        spawns: [
            { type: 'SLIME', count: 6 }
        ]
    },
    7: {
        title: "THE BACKYARD: MARSH TEAM",
        spawns: [
            { type: 'SLIME', count: 4 },
            { type: 'CAT', count: 3 }
        ]
    },
    8: {
        title: "THE BACKYARD: THE SUPERVISOR",
        spawns: [
            { type: 'SLIME', count: 4 },
            { type: 'HUMAN', count: 1 }
        ]
    },
    9: {
        title: "THE BACKYARD: RAT SWARM!",
        spawns: [
            { type: 'RAT', count: 30 }
        ]
    },
    10: {
        title: "BOSS: THE RAGING BULL",
        spawns: [
            { type: 'BULL', count: 1, pos: { x: 0, z: 8 } }
        ]
    },
    11: {
        title: "THE DEEP WOODS: BOAR RUSH",
        spawns: [
            { type: 'WILD_BOAR', count: 3 },
            { type: 'RAT', count: 8 }
        ]
    },
    12: {
        title: "THE DEEP WOODS: THE MENAGERIE",
        customSpawn: true // Handles the "All types except Bull/Anti-Goose" logic
    },
    13: {
        title: "THE DEEP WOODS: PINE NEEDLE STORM",
        spawns: [
            { type: 'FLY', count: 50, speedMul: 1.2 },
            { type: 'MICRO_SLIME', count: 10 },
            { type: 'ANTI_GOOSE', count: 3 }
        ]
    },
    14: {
        title: "THE DEEP WOODS: BARRAGE OF THE ANCIENTS",
        spawns: [
            { type: 'SLIME', count: 10 },
            { type: 'HUMAN', count: 3 },
            { type: 'WILD_BOAR', count: 2 }
        ]
    },
    15: {
        title: "THE DEEP WOODS: THE ETERNAL HUNT",
        spawns: [
            { type: 'WILD_BOAR', count: 8 },
            { type: 'CAT', count: 8 },
            { type: 'RAT', count: 20 }
        ]
    },
    16: {
        title: "BOSS: THE FOREST TITAN",
        spawns: [
            { type: 'BULL', count: 1, pos: { x: 0, z: 8 }, stats: { maxHp: 200, hp: 200, speed: 2.2 } },
            { type: 'WILD_BOAR', count: 4 }
        ]
    }
};
