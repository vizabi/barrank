import "./styles.scss";

import { 
  BaseComponent,
  TimeSlider,
  DataNotes,
  DataWarning,
  ErrorMessage,
  LocaleService,
  LayoutService,
  TreeMenu,
  SteppedSlider,
  Dialogs,
  ButtonList,
  CapitalVizabiService,
  Repeater,
  versionInfo
} from "@vizabi/shared-components";
import {VizabiBarRank} from "./barrank-cmp.js";

export default class BarRank extends BaseComponent {
  
  constructor(config){
    
    const fullMarker = config.model.markers?.bar;
    const fullMarkerLegend = config.model.markers?.legend;
    config.Vizabi.utils.applyDefaults(fullMarker?.config || {}, BarRank.DEFAULT_MODEL.bar);   
    config.Vizabi.utils.applyDefaults(fullMarkerLegend?.config || {}, BarRank.DEFAULT_MODEL.legend);  

    const frameType = config.Vizabi.stores.encodings.modelTypes.frame;
    const { marker, splashMarker } = frameType.splashMarker(fullMarker);
    
    config.name = "barrank";

    config.subcomponents = [{
      type: Repeater,
      placeholder: ".vzb-repeater",
      model: marker,
      options: {
        repeatedComponent: VizabiBarRank,
        repeatedComponentCssClass: "vzb-barrank"
      },
      name: "chart",
    },{
      type: TimeSlider,
      placeholder: ".vzb-timeslider",
      name: "time-slider",
      model: marker
    },{
      type: SteppedSlider,
      placeholder: ".vzb-speedslider",
      name: "speed-slider",
      model: marker
    },{
      type: TreeMenu,
      placeholder: ".vzb-treemenu",
      name: "tree-menu",
      model: marker
    },{
      type: DataWarning,
      placeholder: ".vzb-datawarning",
      options: {appendButtonHere: ".vzb-repeater"},
      model: marker,
      name: "data-warning"
    },{
      type: DataNotes,
      placeholder: ".vzb-datanotes",
      model: marker
    },{
      type: Dialogs,
      placeholder: ".vzb-dialogs",
      model: marker,
      name: "dialogs"
    },{
      type: ButtonList,
      placeholder: ".vzb-buttonlist",
      name: "buttons",
      model: marker
    },{
      type: ErrorMessage,
      placeholder: ".vzb-errormessage",
      model: marker,
      name: "error-message"
    }];

    config.template = `
      <div class="vzb-repeater"></div>
      <div class="vzb-animationcontrols">
        <div class="vzb-timeslider"></div>
        <div class="vzb-speedslider"></div>
      </div>
      <div class="vzb-sidebar">
        <div class="vzb-dialogs"></div>
        <div class="vzb-buttonlist"></div>
      </div>
      <div class="vzb-treemenu"></div>
      <div class="vzb-datanotes"></div>
      <div class="vzb-datawarning"></div>
      <div class="vzb-errormessage"></div>
    `;

    config.locale.Vizabi = config.Vizabi;
    config.layout.Vizabi = config.Vizabi;
    config.services = {
      Vizabi: new CapitalVizabiService({Vizabi: config.Vizabi}),
      locale: new LocaleService(config.locale),
      layout: new LayoutService(config.layout)
    };

    super(config);

    this.splashMarker = splashMarker;
  }
}


BarRank.DEFAULT_UI = {
  "locale": { "id": "en", "shortNumberFormat": true },
  "layout": { "projector": false },

  "buttons": {
    "buttons": ["markercontrols", "colors", "moreoptions", "presentation", "sidebarcollapse", "fullscreen"]
  },
  "dialogs": {
    "dialogs": {
      "popup": ["timedisplay", "colors", "markercontrols", "moreoptions"],
      "sidebar": ["timedisplay", "colors", "markercontrols"],
      "moreoptions": ["opacity", "speed", "colors", "repeat", "technical", "presentation", "about"]
    },
    "markercontrols": {
      "disableSlice": true,
      "disableAddRemoveGroups": true,
      "primaryDim": null,
      "drilldown": null,
      "shortcutForSwitch": false,
      "shortcutForSwitch_allow": null
    }
  },
  "marker-contextmenu": {
    "primaryDim": null,
    "drilldown": null,
  },
  "time-slider": {
    "show_value": false
  },
  "chart": {
    "lilFrameDisplayAlwaysHidden": true,
    "showForecast": false,
    "showForecastOverlay": true,
    "pauseBeforeForecast": true,
    "endBeforeForecast": null, //value like "2022", auto-resolved to current time minus one frame step
    "opacityHighlight": 1.0,
    "opacitySelect": 1.0,
    "opacityHighlightDim": 0.3,
    "opacitySelectDim": 0.5,
    "opacityRegular": 1.0
  },
  "data-warning": {
    "enable": false,
    "margin": {
      "LARGE": { "bottom": 90 },
      "MEDIUM": { "bottom": 70 },
      "SMALL": { "bottom": 50 }
    }
  },
  "tree-menu": {
    "showDataSources": false,
    "folderStrategyByDataset": {}
  }
};

BarRank.DEFAULT_MODEL = {
  "bar": {
    "requiredEncodings": ["x"],
    "encoding": {
      "show": { "modelType": "selection" },
      "selected": { "modelType": "selection" },
      "highlighted": { "modelType": "selection" },
      "x": {
        "data": { },
        "scale": {
          "allowedTypes": ["linear", "log", "genericLog", "pow"]
        }
      },
      "color": {
        "data": { "constant": "_default" },
        "scale": {
          "modelType": "color"
        }
      },
      "label": { "data": { "modelType": "entityPropertyDataConfig" } },
      "frame": { "modelType": "frame", "speed": 200, "splash": true },
      "repeat": {
        "modelType": "repeat",
        "allowEnc": ["x"]
      }
    }
  },
  "legend": {
    "data": {
      "ref": {
        "transform": "entityConceptSkipFilter",
        "path": "markers.bar.encoding.color"
      }
    },
    "encoding": {
      "color": {
        "data": {
          "concept": { "ref": "markers.bar.encoding.color.data.concept" },
          "constant": { "ref": "markers.bar.encoding.color.data.constant" }
        },
        "scale": {
          "modelType": "color",
          "palette": { "ref": "markers.bar.encoding.color.scale.palette" },
          "domain": null,
          "range": null,
          "type": null,
          "zoomed": null,
          "zeroBaseline": false,
          "clamp": false,
          "allowedTypes": null
        }
        //"scale": { "ref": "markers.bar.encoding.color.scale" }
      },
      "name": { "data": { } },
      "order": {
        "modelType": "order",
        "direction": "asc",
        "data": { }
      },
      "map": { "data": { } }
    }
  },
};

BarRank.versionInfo = { version: __VERSION, build: __BUILD, package: __PACKAGE_JSON_FIELDS, sharedComponents: versionInfo};