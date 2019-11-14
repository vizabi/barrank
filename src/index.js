import "./styles.scss";

import { 
  BaseComponent,
  TimeSlider,
  DataNotes,
  LocaleService,
  LayoutService,
  TreeMenu,
  SteppedSlider,
  ButtonList 
} from "VizabiSharedComponents";
import VizabiBarRankChart from "./component.js";

export default class BarRankChart extends BaseComponent {

  constructor(config){
    config.subcomponents = [{
      type: VizabiBarRankChart,
      placeholder: ".vzb-barrankchart",
      //model: this.model
      name: "chart"
    },{
      type: TimeSlider,
      placeholder: ".vzb-timeslider",
      name: "time-slider"
      //model: this.model
    },{
      type: SteppedSlider,
      placeholder: ".vzb-speedslider",
      name: "speed-slider"
      //model: this.model
    },{
      type: TreeMenu,
      placeholder: ".vzb-treemenu",
      name: "tree-menu"
      //model: this.model
    },{
      type: DataNotes,
      placeholder: ".vzb-datanotes",
      //model: this.model
    },{
      type: ButtonList,
      placeholder: ".vzb-buttonlist",
      name: "buttons"
      //model: this.model
    }];

    config.template = `
      <div class="vzb-barrankchart"></div>
      <div class="vzb-animationcontrols">
        <div class="vzb-timeslider"></div>
        <div class="vzb-speedslider"></div>
      </div>
      <div class="vzb-sidebar">
        <div class="vzb-buttonlist"></div>
      </div>
      <div class="vzb-treemenu"></div>
      <div class="vzb-datanotes"></div>
    `;

    config.services = {
      locale: new LocaleService(),
      layout: new LayoutService(config)
    };

    //register locale service in the marker model
    config.model.config.data.locale = config.services.locale;

    super(config);
  }
}
