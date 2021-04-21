import "./styles.scss";

import { 
  BaseComponent,
  TimeSlider,
  DataNotes,
  DataWarning,
  LocaleService,
  LayoutService,
  TreeMenu,
  SteppedSlider,
  Dialogs,
  ButtonList 
} from "VizabiSharedComponents";
import {VizabiBarRankChart} from "./component.js";

export default class BarRankChart extends BaseComponent {
  
  constructor(config){
    
    const fullMarker = config.model.markers.bar;
    Vizabi.utils.applyDefaults(fullMarker.config, BarRankChart.DEFAULT_CORE);

    const frameType = Vizabi.stores.encodings.modelTypes.frame;
    const { marker, splashMarker } = frameType.splashMarker(fullMarker);

    config.name = "barrankchart";

    config.subcomponents = [{
      type: VizabiBarRankChart,
      placeholder: ".vzb-barrankchart",
      model: marker,
      name: "chart"
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
      options: {button: ".vzb-datawarning-button"},
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
    }];

    config.template = `
      <div class="vzb-barrankchart"></div>
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
    `;

    config.services = {
      locale: new LocaleService(config.locale),
      layout: new LayoutService(config.layout)
    };

    super(config);

    this.splashMarker = splashMarker;
  }
}


BarRankChart.DEFAULT_UI = {
  chart: {
  }
};

BarRankChart.DEFAULT_CORE = {
  requiredEncodings: ["x"],
  encoding: {
    selected: {
      modelType: "selection"
    },
    highlighted: {
      modelType: "selection"
    },
    x: {
      scale: {
        allowedTypes: ["linear", "log", "genericLog", "pow"]
      }
    },
    color: {
      scale: {
        modelType: "color"
      }
    },
    label: {
      data: {
        modelType: "entityPropertyDataConfig"
      }
    },
    frame: {
      modelType: "frame",
    }
  }
};

BarRankChart.versionInfo = { version: __VERSION, build: __BUILD };