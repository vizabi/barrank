import "./styles.scss";
import component from "./component";

export default Vizabi.Tool.extend("BarRankChart", {

  // Run when the tool is created
  init: function (placeholder, externalModel) {

    this.name = "barrankchart";

    this.components = [{
      component: component,
      placeholder: ".vzb-tool-viz",
      model: ["state.time", "state.entities", "state.marker", "locale", "ui"]
    }, {
      component: Vizabi.Component.get("timeslider"),
      placeholder: ".vzb-tool-timeslider",
      model: ["state.time", "state.entities", "state.marker", "ui"]
    }, {
      component: Vizabi.Component.get("dialogs"),
      placeholder: ".vzb-tool-dialogs",
      model: ["state", "ui", "locale"]
    }, {
      component: Vizabi.Component.get("buttonlist"),
      placeholder: ".vzb-tool-buttonlist",
      model: ["state", "ui", "locale"]
    }, {
      component: Vizabi.Component.get("treemenu"),
      placeholder: ".vzb-tool-treemenu",
      model: ["state.marker", "state.marker_tags", "state.time", "locale"]
    }, {
      component: Vizabi.Component.get("datanotes"),
      placeholder: ".vzb-tool-datanotes",
      model: ["state.marker", "locale"]
    }, {
      component: Vizabi.Component.get("datawarning"),
      placeholder: ".vzb-tool-datawarning",
      model: ["locale"]
    }, {
      component: Vizabi.Component.get("steppedspeedslider"),
      placeholder: ".vzb-tool-stepped-speed-slider",
      model: ["state.time", "locale"]
    }];

    // constructor is the same as any tool
    this._super(placeholder, externalModel);
  },

  /**
   * Determines the default model of this tool
   */
  default_model: {
    "state": {
      "time": {
        "autogenerate": {
          "data": "data",
          "conceptIndex": 0,
          "conceptType": "time"
        }
      },
      "entities": {
        "autogenerate": {
          "data": "data",
          "conceptIndex": 0
        }
      },
      "entities_colorlegend": {
        "autogenerate": {
          "data": "data",
          "conceptIndex": 0
        }
      },
      "entities_tags": {},
      "marker_tags": {
        "space": ["entities_tags"],
        "label": {},
        "hook_parent": {}
      },
      "entities_allpossible": {
        "autogenerate": {
          "data": "data",
          "conceptIndex": 0
        }
      },
      "marker_allpossible": {
        "space": ["entities_allpossible"],
        "label": {
          "use": "property",
          "autogenerate": {
            "conceptIndex": 0
          }
        }
      },
      "marker": {
        "space": ["entities", "time"],
        "axis_x": {
          "use": "indicator",
          "allow": { scales: ["linear", "log"] },
          "autogenerate": {
            "conceptIndex": 0,
            "conceptType": "measure"
          }
        },
        "axis_y": {
          "use": "property",
          "allow": { scales: ["ordinal", "nominal"] },
          "autogenerate": {
            "conceptIndex": 0
          }
        },
        "label": {
          "use": "property",
          "autogenerate": {
            "conceptIndex": 0
          }
        },
        "color": {
          "syncModels": ["marker_colorlegend"],
          "autogenerate": {
            "conceptIndex": 0,
            "conceptType": "entity_set"
          }
        }
      },
      "marker_colorlegend": {
        "space": ["entities_colorlegend"],
        "label": {
          "use": "property",
          "which": "name"
        },
        "hook_rank": {
          "use": "property",
          "which": "rank"
        },
        "hook_geoshape": {
          "use": "property",
          "which": "shape_lores_svg"
        }
      }
    },
    locale: {},
    ui: {
      chart: {},
      datawarning: {
        doubtDomain: [],
        doubtRange: []
      },
      "buttons": ["colors", "find", "show", "moreoptions", "fullscreen", "presentation"],
      "dialogs": {
        "popup": ["timedisplay", "colors", "find", "axes", "show", "moreoptions"],
        "sidebar": ["timedisplay", "colors", "find"],
        "moreoptions": ["opacity", "speed", "colors", "presentation", "about"]
      },
      presentation: false
    }
  }
});
