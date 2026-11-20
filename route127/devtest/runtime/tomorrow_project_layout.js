// Approved DEVTEST Workshop export.
globalThis.TomorrowProjectApprovedLayout = {
  "actors": {
    "syn": {
      "x": 50,
      "y": 50,
      "scale": 100,
      "layer": 3,
      "visible": true
    },
    "luna": {
      "x": 11.2,
      "y": 51.4,
      "scale": 30,
      "layer": 2,
      "visible": false
    },
    "flora": {
      "x": 0,
      "y": 0,
      "scale": 18,
      "layer": 2,
      "visible": false
    }
  },
  "paths": {
    "walk": {
      "fromX": -20,
      "toX": 80,
      "fromY": 0,
      "toY": 0,
      "duration": 2500,
      "speed": 0.6,
      "pause": 0,
      "facing": "auto"
    },
    "glance": {
      "fromX": 0,
      "toX": 70,
      "fromY": 0,
      "toY": 0,
      "duration": 2400,
      "speed": 1,
      "pause": 300,
      "facing": "auto"
    },
    "coffee": {
      "fromX": -20,
      "toX": 120,
      "fromY": 0,
      "toY": 0,
      "duration": 2400,
      "speed": 1,
      "pause": 0,
      "facing": "auto"
    },
    "peek": {
      "fromX": -20,
      "toX": 120,
      "fromY": 0,
      "toY": 0,
      "duration": 2400,
      "speed": 1,
      "pause": 0,
      "facing": "auto"
    },
    "floraPeek": {
      "fromX": -20,
      "toX": 120,
      "fromY": 0,
      "toY": 0,
      "duration": 2400,
      "speed": 1,
      "pause": 0,
      "facing": "auto"
    },
    "floraRun": {
      "fromX": 0,
      "toX": 65,
      "fromY": 0,
      "toY": 0,
      "duration": 1600,
      "speed": 1,
      "pause": 0,
      "facing": "auto"
    }
  },
  "placements": {
    "walk": {
      "x": null,
      "y": null,
      "scale": null,
      "layer": null
    },
    "turn": {
      "x": null,
      "y": null,
      "scale": 35,
      "layer": null
    },
    "coffee": {
      "x": null,
      "y": null,
      "scale": null,
      "layer": null
    },
    "peek": {
      "x": null,
      "y": null,
      "scale": null,
      "layer": null
    },
    "floraPeek": {
      "x": 13.2,
      "y": 72.7,
      "scale": 17,
      "layer": 1
    },
    "floraRun": {
      "x": -10,
      "y": 80,
      "scale": 20,
      "layer": 3
    }
  },
  "timelines": {
    "walk": [
      {
        "type": "move",
        "clip": "walk",
        "target": "waypoint",
        "x": 75,
        "y": 56,
        "duration": 3000,
        "facing": "auto"
      },
      {
        "type": "pause",
        "duration": 1500
      },
      {
        "type": "move",
        "clip": "walk",
        "target": "origin",
        "x": 75,
        "y": 56,
        "duration": 3000,
        "facing": "auto"
      }
    ],
    "glance": [
      {
        "type": "move",
        "clip": "walk",
        "target": "waypoint",
        "x": 70,
        "y": 51.4,
        "duration": 2400,
        "facing": "auto"
      },
      {
        "type": "hold",
        "clip": "turn",
        "frame": 9,
        "duration": 2500,
        "facing": "auto"
      }
    ],
    "coffee": [
      {
        "type": "move",
        "clip": "walk",
        "target": "placement",
        "x": 120,
        "y": 56,
        "duration": 2400,
        "facing": "auto"
      },
      {
        "type": "hold",
        "clip": "coffee",
        "frame": 9,
        "duration": 500,
        "facing": "auto"
      }
    ],
    "peek": [
      {
        "type": "hold",
        "clip": "peek",
        "frame": 9,
        "duration": 4000,
        "facing": "auto"
      }
    ],
    "floraPeek": [
      {
        "type": "play",
        "clip": "floraPeek",
        "facing": "auto"
      }
    ],
    "floraRun": [
      {
        "type": "move",
        "clip": "floraRun",
        "target": "waypoint",
        "x": 57,
        "y": 78,
        "duration": 1600,
        "facing": "auto"
      },
      {
        "type": "pause",
        "duration": 4000
      }
    ]
  },
  "probability": 40,
  "cooldown": 1000,
  "peekLayer": 1,
  "speed": 1,
  "loop": false
};
