import {decorate, computed} from "mobx";

import { BaseComponent } from "VizabiSharedComponents";
import { LegacyUtils as legacyUtils} from "VizabiSharedComponents";
import { Icons } from "VizabiSharedComponents";
import { Utils as utils } from "VizabiSharedComponents";

const {ICON_WARN, ICON_QUESTION} = Icons;
const COLOR_BLACKISH = "rgb(51, 51, 51)";
const COLOR_WHITEISH = "rgb(253, 253, 253)";

const PROFILE_CONSTANTS = {
  SMALL: {
    margin: {top: 60, right: 20, left: 5, bottom: 20},
    headerMargin: {top: 10, right: 20, bottom: 20, left: 20},
    infoElHeight: 16,
    infoElMargin: 5,
    barHeight: 18,
    barMargin: 3,
    barLabelMargin: 5,
    barValueMargin: 5,
    barRankMargin: 6,
    scrollMargin: 25,
    longestLabelLength: 12 //chars
  },
  MEDIUM: {
    margin: {top: 60, right: 25, left: 5, bottom: 20},
    headerMargin: {top: 10, right: 20, bottom: 20, left: 20},
    infoElHeight: 16,
    infoElMargin: 5,
    barHeight: 21,
    barMargin: 3,
    barLabelMargin: 5,
    barValueMargin: 5,
    barRankMargin: 10,
    scrollMargin: 30,
    longestLabelLength: 12 //chars
  },
  LARGE: {
    margin: {top: 60, right: 30, left: 5, bottom: 20},
    headerMargin: {top: 10, right: 20, bottom: 20, left: 20},
    infoElHeight: 16,
    infoElMargin: 5,
    barHeight: 28,
    barMargin: 4,
    barLabelMargin: 5,
    barValueMargin: 5,
    barRankMargin: 10,
    scrollMargin: 30,
    longestLabelLength: 12 //chars
  }
};

const PROFILE_CONSTANTS_FOR_PROJECTOR = {
  MEDIUM: {
    margin: {top: 60, right: 30, left: 10, bottom: 40},
    headerMargin: {top: 10, right: 20, bottom: 20, left: 20},
    infoElHeight: 25,
    infoElMargin: 10,
    barHeight: 25,
    barMargin: 6
  },
  LARGE: {
    margin: {top: 60, right: 35, left: 10, bottom: 40},
    headerMargin: {top: 10, right: 20, bottom: 20, left: 20},
    infoElHeight: 16,
    infoElMargin: 10,
    barHeight: 30,
    barMargin: 6
  }
};

class _VizabiBarRankChart extends BaseComponent {

  constructor(config) {
    config.template = `
      <svg class="vzb-br-header">
        <g class="vzb-br-title">
          <text></text>
        </g>
        <g class="vzb-br-total">
          <text></text>
        </g>
        <g class="vzb-br-axis-info vzb-noexport"></g>
      </svg>

      <div class="vzb-br-barsviewport vzb-dialog-scrollable">
        <svg class="vzb-br-bars-svg vzb-export">
          <g class="vzb-br-bars"></g>
          <rect class="vzb-br-forecastoverlay vzb-hidden" x="0" y="0" width="100%" height="100%" fill="url(#vzb-br-pattern-lines)" pointer-events='none'></rect>
        </svg>
      </div>

      <svg class="vzb-data-warning-svg">
        <g class="vzb-data-warning vzb-noexport">
          <svg></svg>
          <text></text>
        </g>
        <g class="vzb-data-warning vzb-data-warning-missed-positions">
          <text></text>
        </g>
      </svg>

      <svg class="vzb-br-tooltip-svg vzb-hidden">
        <g class="vzb-br-tooltip vzb-hidden">
          <rect class="vzb-tooltip-border"></rect>
          <text class="vzb-tooltip-text"></text>
        </g>
      </svg>
      
      <svg>
        <defs>
            <pattern id="vzb-br-pattern-lines" x="0" y="0" patternUnits="userSpaceOnUse" width="50" height="50" viewBox="0 0 10 10"> 
                <path d='M-1,1 l2,-2M0,10 l10,-10M9,11 l2,-2' stroke='black' stroke-width='3' opacity='0.08'/>
            </pattern> 
        </defs>
      </svg>
    `;
    super(config);
  }


  setup() {
    this.DOM = {
      header: this.element.select(".vzb-br-header"),
      title: this.element.select(".vzb-br-title"),
      lilFrameDisplay: this.element.select(".vzb-br-total"),
      info: this.element.select(".vzb-br-axis-info"),
  
      barViewport: this.element.select(".vzb-br-barsviewport"),
      barSvg: this.element.select(".vzb-br-bars-svg"),
      barContainer: this.element.select(".vzb-br-bars"),
      forecastOverlay: this.element.select(".vzb-br-forecastoverlay"),
  
      footer: this.element.select(".vzb-data-warning-svg"),
      dataWarning: this.element.select(".vzb-data-warning"),
      missedPositionsWarning: this.element.select(".vzb-data-warning-missed-positions"),
  
      tooltipSvg: this.element.select(".vzb-br-tooltip-svg"),
      tooltip: this.element.select(".vzb-br-tooltip")
    };

    this.wScale = d3.scaleLinear()
      .domain(this.ui.datawarning.doubtDomain)
      .range(this.ui.datawarning.doubtRange);

    this._cache = {};
  }

  get MDL(){
    return {
      frame: this.model.encoding.frame,
      selected: this.model.encoding.selected.data.filter,
      highlighted: this.model.encoding.highlighted.data.filter,
      x: this.model.encoding.x,
      color: this.model.encoding.color,
      label: this.model.encoding.label
    };
  }

  


  draw() {
    this.localise = this.services.locale.auto();

    // new scales and axes
    this.xScale = this.MDL.x.scale.d3Scale.copy();
    this.cScale = this.MDL.color.scale.d3Scale;
    
    this.addReaction(this._drawForecastOverlay);
    
    if (this._updateLayoutProfile()) return; //return if exists with error
    this.addReaction(this._getDuration);
    this.addReaction(this._drawHeader);
    this.addReaction(this._drawInfoEl);
    this.addReaction(this._drawFooter);
    this.addReaction(this._estimateLabelAndValueWidth);

    //this.addReaction(this._processFrameData);
    //this.addReaction(this._createAndDeleteBars);
    this.addReaction(this._drawData);
    this.addReaction(this._updateOpacity);
    this.addReaction(this._resizeSvg);
    this.addReaction(this._scroll);

    this.addReaction(this._drawForecastOverlay);
    this.addReaction(this._updateFrameDisplay);
    this.addReaction(this.updateDoubtOpacity);
  }

  _getDuration() {
    //smooth animation is needed when playing, except for the case when time jumps from end to start
    if(!this.MDL.frame) return 0;
    this.frameValue_1 = this.frameValue;
    this.frameValue = this.MDL.frame.value;
    return this.__duration = this.MDL.frame.playing && (this.frameValue - this.frameValue_1 > 0) ? this.MDL.frame.speed : 0;
  }
  
  _drawForecastOverlay() {
    this.DOM.forecastOverlay.classed("vzb-hidden", 
    !this.ui.showForecast || 
    !this.ui.showForecastOverlay || 
    !this.ui.endBeforeForecast || 
      (this.MDL.frame.value <= this.MDL.frame.parseValue(this.ui.endBeforeForecast))
    );
  }

  _updateLayoutProfile(){
    this.services.layout.size;

    this.profileConstants = this.services.layout.getProfileConstants(PROFILE_CONSTANTS, PROFILE_CONSTANTS_FOR_PROJECTOR);
    this.height = this.element.node().clientHeight || 0;
    this.width = this.element.node().clientWidth || 0;
    if (!this.height || !this.width) return legacyUtils.warn("Chart _updateProfile() abort: container is too little or has display:none");
  }

  _updateFrameDisplay() {
    const duration = this._getDuration();
    if (duration) {
      this.DOM.lilFrameDisplay.select("text")
        .transition("text")
        .delay(duration)
        .text(this.localise(this.MDL.frame.value));
    } else {
      this.DOM.lilFrameDisplay.select("text")
        .interrupt()
        .text(this.localise(this.MDL.frame.value));
    }
  }

  _drawHeader() {
    const {
      margin,
      headerMargin,
      infoElHeight,
      infoElMargin,
    } = this.profileConstants;

    this.services.layout.size;
    this.services.layout.projector;

    // header
    this.DOM.header.attr("height", margin.top);
    const headerTitle = this.DOM.title;

    // change header titles for new data
    const { name, unit } = this.MDL.x.data.conceptProps;

    const headerTitleText = headerTitle.select("text");

    if (unit) {
      headerTitleText.text(`${name}, ${unit}`);

      const rightEdgeOfLeftText = headerMargin.left
        + headerTitle.node().getBBox().width
        + infoElMargin
        + infoElHeight;

      if (rightEdgeOfLeftText > this.width - headerMargin.right) {
        headerTitleText.text(name);
      }
    } else {
      headerTitleText.text(name);
    }

    const headerTitleBBox = headerTitle.node().getBBox();

    const titleTx = headerMargin.left;
    const titleTy = headerMargin.top + headerTitleBBox.height;
    headerTitle
      .attr("transform", `translate(${titleTx}, ${titleTy})`);

    const headerInfo = this.DOM.info;

    headerInfo.select("svg")
      .attr("width", `${infoElHeight}px`)
      .attr("height", `${infoElHeight}px`);

    const infoTx = titleTx + headerTitle.node().getBBox().width + infoElMargin;
    const infoTy = headerMargin.top + infoElHeight / 4;
    headerInfo.attr("transform", `translate(${infoTx}, ${infoTy})`);
   
    const lilFrameBBox = this.DOM.lilFrameDisplay.node().getBBox();
    const lilFrameTx = this.width - headerMargin.right - lilFrameBBox.width;
    const lilFrameTy = headerMargin.top + lilFrameBBox.height;
    this.DOM.lilFrameDisplay
      .attr("transform", `translate(${lilFrameTx}, ${lilFrameTy})`)
      .classed("vzb-hidden", 
        this.ui.lilFrameDisplayAlwaysHidden ||
        this.services.layout.profile !== "LARGE" ||
        headerTitleBBox.width + lilFrameBBox.width + 10 > this.width
      );

    this.treemenu = this.root.findChild({type: "TreeMenu"});

    headerTitle
      .classed("vzb-disabled", this.treemenu.state.ownReadiness !== utils.STATUS.READY)
      .on("click", () =>
        this.treemenu
          .encoding("x")
          .alignX("left")
          .alignY("top")
          .updateView()
          .toggle()
      );

  }

  _drawInfoEl(){
    const dataNotes = this.root.findChild({type: "DataNotes"});
    const conceptPropsX = this.MDL.x.data.conceptProps;
    const infoElHeight = this.profileConstants.infoElHeight;
    const _this = this;

    this.DOM.info
      .on("click", () => {
        dataNotes.pin();
      })
      .on("mouseover", function() {
        const rect = this.getBBox();
        const ctx = legacyUtils.makeAbsoluteContext(this, this.farthestViewportElement);
        const coord = ctx(rect.x - 10, rect.y + rect.height + 10);
        dataNotes
          .setEncoding(_this.MDL.x)
          .show()
          .setPos(coord.x, coord.y);
      })
      .on("mouseout", () => {
        dataNotes.hide();
      })
      .html(ICON_QUESTION)
      .select("svg")
      .attr("width", infoElHeight + "px").attr("height", infoElHeight + "px")
      .classed("vzb-hidden", !conceptPropsX.description && !conceptPropsX.sourceLink);
  }

  _drawFooter(){
    const { margin } = this.profileConstants;

    this.DOM.footer
      .style("height", `${margin.bottom}px`);

    const warningBBox = this.DOM.dataWarning.select("text").node().getBBox();
    this.DOM.dataWarning
      .attr("transform", `translate(${this.width - margin.right - warningBBox.width}, ${warningBBox.height})`);

    this.DOM.dataWarning
      .select("svg")
      .attr("width", warningBBox.height)
      .attr("height", warningBBox.height)
      .attr("x", -warningBBox.height - 5)
      .attr("y", -warningBBox.height + 1);    

    this.DOM.dataWarning.html(ICON_WARN)
      .select("svg")
      .attr("width", 0).attr("height", 0);

    this.DOM.dataWarning.append("text")
      .text(this.localise("hints/dataWarning"));

    this.DOM.dataWarning
      .on("click", () => this.parent.findChild({name: "datawarning"}).toggle())
      .on("mouseover", () => this.updateDoubtOpacity(1))
      .on("mouseout", () => this.updateDoubtOpacity());
  }

  updateDoubtOpacity(opacity) {
    if (opacity == null) opacity = this.wScale(this.MDL.frame.value.getUTCFullYear());
    if (this.MDL.selected.any()) opacity = 1;
    this.DOM.dataWarning.style("opacity", opacity);
  }

  _getLabelText(d) {
    const longestLabelLength = this.profileConstants.longestLabelLength;
    let label = "";
    if (!d.label) 
      label = d[Symbol.for("key")];
    else if (typeof d.label === "string") 
      label = d.label;
    else 
      label = Object.entries(d.label).filter(entry => entry[0] != this.MDL.frame.data.concept).map(entry => entry[1]).join(", ");

    if (label.length >= longestLabelLength) label = label.substring(0, longestLabelLength - 1) + "…";
    return label;
  }

  get __dataProcessed() {
    this.nullValuesCount = 0;

    //purge cache from the items that are no longer in data, to have them set as "new" when re-added
    Object.keys(this._cache).forEach(cacheItem => {
      if (!this.model.dataMap.hasByObjOrStr(null, cacheItem))
        delete this._cache[cacheItem];      
    });

    return this.model.dataArray
      //copy array in order to not sort in place
      .concat()
      //sort array by x value
      .sort((a, b) => d3.descending(a.x, b.x))
      //reduce allows looking at the previous value to calcaulte the rank, as we go
      .reduce((result, d, index) => {
        const id = d[Symbol.for("key")];
        const cached = this._cache[id];
        const value = d.x;
        const color = d.color;
        const valueValid = value || value === 0;
        if (!valueValid) this.nullValuesCount++;
        const formattedValue = valueValid? this.localise(value) : this.localise("hints/nodata");
        const formattedLabel = this._getLabelText(d);
        const rank = !index || result[index - 1].formattedValue !== formattedValue ? index + 1 : result[index - 1].rank;
  
        //cache allows to know which aspects we need to update in particular per DOM marker
        if (cached) {
          result.push(Object.assign(cached, {
            value,
            formattedValue,
            formattedLabel,
            index,
            rank,
            color,
            changedFormattedValue: formattedValue !== cached.formattedValue,
            changedFormattedLabel: formattedLabel !== cached.formattedLabel,
            changedValue: value !== cached.value,
            changedIndex: index !== cached.index,
            changedColor: color !== cached.color,
            isNew: false
          }));
        } else {
          result.push(this._cache[id] = Object.assign({}, d, {
            value,
            formattedValue,
            formattedLabel,
            index,
            rank,
            color,
            changedFormattedValue: true,
            changedFormattedLabel: true,
            changedValue: true,
            changedIndex: true,
            changedColor: true,
            isNew: true
          }));
        }

        return result;
      }, []);
  }

  _drawData() {

    //TODO this is ugly
    const sizes = this.services.layout.size + this.services.layout.projector;
    const sizeChanged = sizes !== this.sizes_1;
    this.sizes_1 = sizes;
    
    this._createAndDeleteBars();
    
    const { barLabelMargin, barValueMargin, barRankMargin, scrollMargin, margin, longestLabelLength } = this.profileConstants;
    let limits = this.MDL.x.scale.domain;
    limits = {min: d3.min(limits), max: d3.max(limits)};
    const ltr = Math.abs(limits.max) >= Math.abs(limits.min);
    const hasNegativeValues = ltr ? limits.min < 0 : limits.max > 0;

    const longestLabelW = this.__labelCharWidth * longestLabelLength;

    const rightEdge = (
      this.width
      - margin.right
      - margin.left
      - barLabelMargin
      - scrollMargin
      - (hasNegativeValues ? 0 : longestLabelW)
    ) / (hasNegativeValues ? 2 : 1);

    this.xScale.range([0, rightEdge]);
    
    if (this.MDL.x.scale.type !== "log") {
      this.xScale.domain([0, Math.max(...this.xScale.domain())]);
    }

    const shift = hasNegativeValues ? rightEdge : longestLabelW;

    const isLtrValue = value => ltr ? value >= 0 : value > 0;

    const transition = (selection) =>
      this.__duration ? selection.transition().duration(this.__duration).ease(d3.easeLinear) : selection.interrupt();

    const labelAnchor = value => isLtrValue(value) ? "end" : "start";
    const valueAnchor = value => isLtrValue(value) ? "start" : "end";

    const labelX = value => isLtrValue(value) ? -barLabelMargin : barLabelMargin;
    const valueX = value => isLtrValue(value) ? barValueMargin : -barValueMargin;

    this.DOM.barContainer.attr("transform", `translate(${shift + (ltr ? margin.left : margin.right) + barLabelMargin}, 0)`);

    this.__dataProcessed.forEach((bar) => {
      const { value } = bar;
      const { barHeight } = this.profileConstants;
      const width = Math.max(0, value && this.xScale(Math.abs(value))) || 0;

      if (bar.isNew || sizeChanged || bar.changedValue)
        bar.DOM.label
          .attr("x", labelX(value))
          .attr("y", barHeight / 2)
          .attr("text-anchor", labelAnchor(value));

      if (bar.isNew || bar.changedFormattedLabel) 
        bar.DOM.label
          .text(bar.formattedLabel);

      if (bar.isNew || sizeChanged)
        bar.DOM.rect
          .attr("rx", barHeight / 4)
          .attr("ry", barHeight / 4)
          .attr("height", barHeight);

      if (bar.isNew || sizeChanged || bar.changedValue)
        bar.DOM.value
          .attr("x", valueX(value))
          .attr("y", barHeight / 2)
          .attr("text-anchor", valueAnchor(value));

      if (bar.isNew || sizeChanged || bar.changedFormattedValue) {
        bar.DOM.value
          .text(bar.formattedValue);
        bar.valueWidth = barValueMargin + bar.formattedValue.length * this.__valueCharWidth;
      }

      if (bar.isNew || sizeChanged || bar.changedIndex || bar.changedValue)
        bar.DOM.rank
          .text(value || value === 0 ? "#" + bar.rank : "")
          .attr("y", barHeight / 2)
          .attr("text-anchor", valueAnchor(value));

      if (bar.isNew || sizeChanged || bar.changedIndex)
        transition(bar.DOM.group)
          .attr("transform", `translate(0, ${this._getBarPosition(bar.index)})`);
      
      if (bar.isNew || sizeChanged || bar.changedValue)
        transition(bar.DOM.rect)
          .attr("width", width)
          .attr("x", value < 0 ? -width : 0);

      if (bar.isNew || sizeChanged || bar.changedValue){
        transition(bar.DOM.rank)
          .attr("x", (Math.max(width, bar.valueWidth || 0) + barRankMargin) * (isLtrValue(value) ? 1 : -1));
      }

      if (bar.isNew || bar.changedColor)
        this._updateColor(bar);      
    });
  }


  _createAndDeleteBars() {
    const _this = this;

    const updatedBars = this.DOM.barContainer.selectAll(".vzb-br-bar")
      .data(this.__dataProcessed, d => d[Symbol.for("key")]);

    // remove groups for entities that are gone
    updatedBars.exit().remove();

    // make the groups for the entities which were not drawn yet (.data.enter() does this)
    updatedBars.enter().append("g")
      .each(function(d) {
        const id = d[Symbol.for("key")];

        const group = d3.select(this)
          .attr("class", "vzb-br-bar")
          .attr("id", `vzb-br-bar-${id}-${_this.id}`)
          .classed("vzb-selected", () => _this.MDL.selected.has(d))
          .on("mousemove", () => _this.MDL.highlighted.set(d))
          .on("mouseout", () => _this.MDL.highlighted.delete(d))
          .on("click", () => _this.MDL.selected.toggle(d));

        const label = group.append("text")
          .attr("class", "vzb-br-label")
          .attr("dy", ".325em");

        const rect = group.append("rect")
          .attr("stroke", "transparent");

        const value = group.append("text")
          .attr("class", "vzb-br-value")
          .attr("dy", ".325em");

        const rank = group.append("text")
          .attr("class", "vzb-br-rank")
          .attr("dy", ".325em");

        Object.assign(d, {
          DOM: {
            group,
            label,
            rect,
            value,
            rank
          }
        });
      });
  }

  _estimateLabelAndValueWidth() {
    //updates on resize
    this.services.layout.size;
    this.services.layout.projector;

    const probe = this.DOM.barContainer
      .append("g").attr("class", "vzb-br-bar vzb-br-probe vzb-hidden");

    this.__labelCharWidth = probe.append("text")
      .attr("class", "vzb-br-label")
      .text("0").node().getBBox().width;

    this.__valueCharWidth = probe.append("text")
      .attr("class", "vzb-br-value")
      .text("~").node().getBBox().width;

    probe.remove();
  }

  _getBarPosition(i) {
    return (this.profileConstants.barHeight + this.profileConstants.barMargin) * i;
  }

  _resizeSvg() {
    const { barHeight, barMargin } = this.profileConstants;

    // this.DOM.barViewport
    //   .style("height", `${this.height - margin.bottom - margin.top}px`);

    this.DOM.barSvg
      .attr("height", `${(barHeight + barMargin) * this.__dataProcessed.length}px`);
  }


  _scroll() {
    const follow = this.DOM.barContainer.select(".vzb-selected");
    if (!follow.empty()) {
      const d = follow.datum();
      const yPos = this._getBarPosition(d.index);

      const { margin } = this.profileConstants;
      const height = this.height - margin.top - margin.bottom;

      const scrollTo = yPos - (height + this.profileConstants.barHeight) / 2;
      this.DOM.barViewport.transition().duration(this.__duration)
        .tween("scrollfor" + d.entity, this._scrollTopTween(scrollTo));
    }
  }

  _scrollTopTween(scrollTop) {
    return function() {
      const node = this, i = d3.interpolateNumber(this.scrollTop, scrollTop);
      return function(t) {
        node.scrollTop = i(t);
      };
    };
  }

  _updateColor(bar) {
    const colorValue = bar.color;
    const isColorValid = colorValue || colorValue === 0;

    const fillColor = isColorValid ? this._getColor(colorValue) : COLOR_WHITEISH;
    const strokeColor = isColorValid ? "transparent" : COLOR_BLACKISH;
    const darkerColor = isColorValid ? this._getDarkerColor(bar.color) : COLOR_BLACKISH;

    bar.DOM.rect
      .style("fill", fillColor)
      .style("stroke", strokeColor);

    bar.DOM.value.style("fill", darkerColor);
    bar.DOM.label.style("fill", darkerColor);
    bar.DOM.rank.style("fill", darkerColor);
  }

  _getColor(value) {
    return d3.rgb(this.cScale(value));
  }

  _getDarkerColor(d) {
    return this._getColor(d).darker(2);
  }

  _updateOpacity() {
    const _this = this;

    const {
      opacityHighlightDim,
      opacitySelectDim,
      opacityRegular,
    } = this.ui;

    const someHighlighted = this.MDL.highlighted.markers.size > 0;
    const someSelected = this.MDL.selected.markers.size > 0;

    this.DOM.barContainer.selectAll(".vzb-br-bar")
      .style("opacity", d => {
        if (_this.MDL.highlighted.has(d)) return opacityRegular;
        if (_this.MDL.selected.has(d)) return opacityRegular;

        if (someSelected) return opacitySelectDim;
        if (someHighlighted) return opacityHighlightDim;

        return opacityRegular;
      });
  }
}

_VizabiBarRankChart.DEFAULT_UI = {
  lilFrameDisplayAlwaysHidden: false,
  showForecast: false,
  showForecastOverlay: true,
  pauseBeforeForecast: true,
  opacityHighlight: 1.0,
  opacitySelect: 1.0,
  opacityHighlightDim: 0.3,
  opacitySelectDim: 0.5,
  opacityRegular: 1.0,
  datawarning: {
    doubtDomain: [1800, 1950, 2020],
    doubtRange: [1.0, 0.8, 0.5]
  },
};

//export default chart;
export const VizabiBarRankChart = decorate(_VizabiBarRankChart, {
  "MDL": computed,
  "__dataProcessed": computed
});