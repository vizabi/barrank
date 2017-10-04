const utils = Vizabi.utils;

const axisWithLabelPicker = Vizabi.helpers['d3.axisWithLabelPicker'];
const iconQuestion = Vizabi.iconset.question;
const iconWarn = Vizabi.iconset.warn;

const COLOR_BLACKISH = "rgb(51, 51, 51)";
const COLOR_WHITEISH = "rgb(253, 253, 253)";

const BarRankChart = Vizabi.Component.extend("barrankchart", {

  /**
   * Initializes the component (Bar Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The config passed to the component
   * @param {Object} context The component's parent
   */
  init(config, context) {

    this.name = 'barrankchart';
    this.template = require('./template.html');

    //define expected models for this component
    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "marker",
      type: "marker"
    }, {
      name: "locale",
      type: "locale"
    }, {
      name: "ui",
      type: "ui"
    }];

    this.model_binds = {
      'change:time.value': () => {
        // TODO: review this after vizabi#2450 will be fixed
        if (!this.model._ready) return;

        if (this._readyOnce) {
          this.onTimeChange();
        }
      },
      'change:marker.select': () => {
        if (this._readyOnce) {
          this._selectBars();
          this._updateOpacity();
          this._updateDoubtOpacity();
          this._scroll();
        }
      },
      'change:marker.axis_x.scaleType': () => {
        if (this._readyOnce) {
          if (this.loadData()) {
            this.draw(true);
          }
        }
      },
      'change:marker.color.palette': () => {
        this._drawColors();
      },
      'change:marker.highlight': () => {
        this._updateOpacity();
      },
      'change:marker.opacitySelectDim': () => {
        this._updateOpacity();
      },
      'change:marker.opacityRegular': () => {
        this._updateOpacity();
      },
    };

    //contructor is the same as any component
    this._super(config, context);

    // set up the scales
    this.xScale = null;
    this.cScale = d3.scaleOrdinal(d3.schemeCategory10);

    // set up the axes
    this.xAxis = axisWithLabelPicker("bottom");
  },

  onTimeChange() {
    this.model.marker.getFrame(this.model.time.value, values => {
      this.values = values;

      if (this.values) {
        if (this.loadData()) {
          this.draw();
        }
      }
    });
  },

  /**
   * DOM and model are ready
   */
  readyOnce() {
    this.element = d3.select(this.element);

    // reference elements
    //this.graph = this.element.select('.vzb-br-graph');
    //this.yearEl = this.element.select('.vzb-br-year');
    //this.year = new DynamicBackground(this.yearEl);
    this.header = this.element.select('.vzb-br-header');
    this.infoEl = this.element.select('.vzb-br-axis-info');
    this.barViewport = this.element.select('.vzb-br-barsviewport');
    this.barSvg = this.element.select('.vzb-br-bars-svg');
    this.barContainer = this.element.select('.vzb-br-bars');
    this.dataWarningEl = this.element.select('.vzb-data-warning');
    this.wScale = d3.scaleLinear()
      .domain(this.model.ui.datawarning.doubtDomain)
      .range(this.model.ui.datawarning.doubtRange);

    // set up formatters
    this.xAxis.tickFormat(this.model.marker.axis_x.getTickFormatter());

    this._localeId = this.model.locale.id;
    this._entityLabels = {};
    this._presentation = !this.model.ui.presentation;
    this._formatter = this.model.marker.axis_x.getTickFormatter();

    this.ready();

    this._selectBars();

  },

  /**
   * Both model and DOM are ready
   */
  ready() {
    this.model.marker.getFrame(this.model.time.value, values => {
      this.values = values;

      if (this.values) {
        if (this.loadData()) {
          this.draw(true);
          this._updateOpacity();
          this._drawColors();
        }
      }
    });
  },

  resize() {
    this.draw(true);
    this._drawColors();
  },

  loadData() {
    const _this = this;

    this.translator = this.model.locale.getTFunction();
    // sort the data (also sets this.total)
    const xAxisValues = this.values.axis_x;
    if (!Object.keys(xAxisValues).length) return false;

    this.sortedEntities = this._sortByIndicator(xAxisValues);

    this.header
      .select('.vzb-br-title')
      .select('text')
      .on('click', () =>
        this.parent
          .findChildByName('gapminder-treemenu')
          .markerID('axis_x')
          .alignX('left')
          .alignY('top')
          .updateView()
          .toggle()
      );

    // new scales and axes
    this.xScale = this.model.marker.axis_x.getScale().copy();
    this.cScale = this.model.marker.color.getScale();

    utils.setIcon(this.dataWarningEl, iconWarn)
      .select('svg')
      .attr('width', 0).attr('height', 0);

    this.dataWarningEl.append('text')
      .text(this.translator('hints/dataWarning'));

    this.dataWarningEl
      .on('click', () => this.parent.findChildByName('gapminder-datawarning').toggle())
      .on('mouseover', () => this._updateDoubtOpacity(1))
      .on('mouseout', () => this._updateDoubtOpacity());

    const conceptPropsX = this.model.marker.axis_x.getConceptprops();
    utils.setIcon(this.infoEl, iconQuestion)
      .select('svg').attr('width', 0).attr('height', 0)
      .style('opacity', Number(Boolean(conceptPropsX.description || conceptPropsX.sourceLink)));

    this.infoEl.on('click', () => {
      this.parent.findChildByName('gapminder-datanotes').pin();
    });

    this.infoEl.on('mouseover', function() {
      const rect = this.getBBox();
      const ctx = utils.makeAbsoluteContext(this, this.farthestViewportElement);
      const coord = ctx(rect.x - 10, rect.y + rect.height + 10);
      _this.parent.findChildByName('gapminder-datanotes')
        .setHook('axis_x')
        .show()
        .setPos(coord.x, coord.y);
    });

    this.infoEl.on('mouseout', () => {
      _this.parent.findChildByName('gapminder-datanotes').hide();
    });

    return true;
  },

  draw(force = false) {
    this.time_1 = this.time == null ? this.model.time.value : this.time;
    this.time = this.model.time.value;
    //smooth animation is needed when playing, except for the case when time jumps from end to start
    const duration = this.model.time.playing && (this.time - this.time_1 > 0) ? this.model.time.delayAnimations : 0;

    //return if drawAxes exists with error
    if (this.drawAxes(duration, force)) return;
    this.drawData(duration, force);
  },

  /*
   * draw the chart/stage
   */
  drawAxes(duration = 0) {
    const profiles = {
      small: {
        margin: { top: 60, right: 5, left: 5, bottom: 20 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        infoElMargin: 5,
        barHeight: 18,
        barMargin: 3,
        barRectMargin: 5,
        barValueMargin: 5,
        scrollMargin: 20,
      },
      medium: {
        margin: { top: 60, right: 5, left: 5, bottom: 20 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        infoElMargin: 5,
        barHeight: 21,
        barMargin: 3,
        barRectMargin: 5,
        barValueMargin: 5,
        scrollMargin: 25,
      },
      large: {
        margin: { top: 60, right: 5, left: 5, bottom: 20 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        infoElMargin: 5,
        barHeight: 28,
        barMargin: 4,
        barRectMargin: 5,
        barValueMargin: 5,
        scrollMargin: 25,
      }
    };

    const presentationProfileChanges = {
      medium: {
        margin: { top: 60, right: 10, left: 10, bottom: 40 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 25,
        infoElMargin: 10,
        barHeight: 25,
        barMargin: 6
      },
      large: {
        margin: { top: 60, right: 10, left: 10, bottom: 40 },
        headerMargin: { top: 10, right: 20, bottom: 20, left: 20 },
        infoElHeight: 16,
        infoElMargin: 10,
        barHeight: 30,
        barMargin: 6
      }
    };

    this.activeProfile = this.getActiveProfile(profiles, presentationProfileChanges);

    const {
      margin,
      headerMargin,
      infoElHeight,
      infoElMargin,
    } = this.activeProfile;

    this.height = parseInt(this.element.style('height'), 10) || 0;
    this.width = parseInt(this.element.style('width'), 10) || 0;

    if (!this.height || !this.width) return utils.warn('Dialog resize() abort: vizabi container is too little or has display:none');

    this.barViewport
      .style('height', `${this.height - margin.bottom - margin.top}px`);

    // header
    this.header.attr('height', margin.top);
    const headerTitle = this.header.select('.vzb-br-title');

    // change header titles for new data
    const { name, unit } = this.model.marker.axis_x.getConceptprops();

    const headerTitleText = headerTitle
      .select('text');

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
      .attr('transform', `translate(${titleTx}, ${titleTy})`);

    const headerInfo = this.infoEl;

    headerInfo.select('svg')
      .attr('width', `${infoElHeight}px`)
      .attr('height', `${infoElHeight}px`);

    const infoTx = titleTx + headerTitle.node().getBBox().width + infoElMargin;
    const infoTy = headerMargin.top + infoElHeight / 4;
    headerInfo.attr('transform', `translate(${infoTx}, ${infoTy})`);


    const headerTotal = this.header.select('.vzb-br-total');

    if (duration) {
      headerTotal.select('text')
        .transition('text')
        .delay(duration)
        .text(this.model.time.formatDate(this.time));
    } else {
      headerTotal.select('text')
        .interrupt()
        .text(this.model.time.formatDate(this.time));
    }
    headerTotal.style('opacity', Number(this.getLayoutProfile() !== 'large'));

    const headerTotalBBox = headerTotal.node().getBBox();

    const totalTx = this.width - headerMargin.right - headerTotalBBox.width;
    const totalTy = headerMargin.top + headerTotalBBox.height;
    headerTotal
      .attr('transform', `translate(${totalTx}, ${totalTy})`)
      .classed('vzb-transparent', headerTitleBBox.width + headerTotalBBox.width + 10 > this.width);

    this.element.select('.vzb-data-warning-svg')
      .style('height', `${margin.bottom}px`);


    const warningBBox = this.dataWarningEl.select('text').node().getBBox();
    this.dataWarningEl
      .attr('transform', `translate(${this.width - margin.right - warningBBox.width}, ${warningBBox.height})`)
      .select('text');

    this.dataWarningEl
      .select('svg')
      .attr('width', warningBBox.height)
      .attr('height', warningBBox.height)
      .attr('x', -warningBBox.height - 5)
      .attr('y', -warningBBox.height + 1);

    this._updateDoubtOpacity();
  },

  drawData(duration = 0, force = false) {
    // update the shown bars for new data-set
    this._createAndDeleteBars(
      this.barContainer.selectAll('.vzb-br-bar')
        .data(this.sortedEntities, d => d.entity)
    );


    const { presentation } = this.model.ui;
    const presentationModeChanged = this._presentation !== presentation;

    if (presentationModeChanged) {
      this._presentation = presentation;
    }


    const entitiesCountChanged = typeof this._entitiesCount === 'undefined'
      || this._entitiesCount !== this.sortedEntities.length;

    if (presentationModeChanged || entitiesCountChanged) {
      if (entitiesCountChanged) {
        this._entitiesCount = this.sortedEntities.length;
      }
    }

    this._resizeSvg();
    this._scroll(duration);
    this._drawColors();


    const { barRectMargin, barValueMargin, scrollMargin, margin } = this.activeProfile;
    const { axis_x } = this.model.marker;
    const limits = axis_x.getLimits(axis_x.which);
    const ltr = Math.abs(limits.max) >= Math.abs(limits.min);
    const hasNegativeValues = ltr ? limits.min < 0 : limits.max > 0;


    const rightEdge = (
        this.width
        - margin.right
        - margin.left
        - barRectMargin
        - scrollMargin
        - (hasNegativeValues ? 0 : this._getWidestLabelWidth())
      ) / (hasNegativeValues ? 2 : 1);

    this.xScale
      .range([0, rightEdge]);
    
    if (this.model.marker.axis_x.scaleType !== "log") {
      this.xScale
        .domain([0, Math.max(...this.xScale.domain())]);
    }

    const shift = hasNegativeValues ? rightEdge : this._getWidestLabelWidth();

    const barWidth = (value) => this.xScale(value);
    const isLtrValue = value => ltr ? value >= 0 : value > 0;

    const labelAnchor = value => isLtrValue(value) ? 'end' : 'start';
    const valueAnchor = value => isLtrValue(value) ? 'start' : 'end';

    const labelX = value => isLtrValue(value) ?
      (margin.left + shift) :
      (this.width - shift - scrollMargin - margin.right);

    const barX = value => isLtrValue(value) ?
      (labelX(value) + barRectMargin) :
      (labelX(value) - barRectMargin);

    const valueX = value => isLtrValue(value) ?
      (barX(value) + barValueMargin) :
      (barX(value) - barValueMargin);

    const isLabelBig = (this._getWidestLabelWidth(true) + (ltr ? margin.left : margin.right)) < shift;
    this.sortedEntities.forEach((bar) => {
      const { value } = bar;

      if (force || presentationModeChanged || bar.isNew || bar.changedValue) {
        bar.barLabel
          .attr('x', labelX(value))
          .attr('y', this.activeProfile.barHeight / 2)
          .attr('text-anchor', labelAnchor(value))
          .text(isLabelBig ? bar.labelFull : bar.labelSmall);

        bar.barRect
          .attr('rx', this.activeProfile.barHeight / 4)
          .attr('ry', this.activeProfile.barHeight / 4)
          .attr('height', this.activeProfile.barHeight);

        bar.barValue
          .attr('x', valueX(value))
          .attr('y', this.activeProfile.barHeight / 2)
          .attr('text-anchor', valueAnchor(value));
      }

      if (force || bar.changedWidth || presentationModeChanged) {
        const width = Math.max(0, value && barWidth(Math.abs(value))) || 0;

        if (force || bar.changedWidth || presentationModeChanged) {
          bar.barRect
            .transition().duration(duration).ease(d3.easeLinear)
            .attr('width', width)
        }

        bar.barRect
          .attr('x', barX(value) - (value < 0 ? width : 0));

        if (force || bar.changedValue) {
          bar.barValue
            .text(this._formatter(value) || this.translator('hints/nodata'));
        }
      }

      if (force || bar.changedIndex || presentationModeChanged) {
        (duration ? bar.self.transition().duration(duration).ease(d3.easeLinear) : bar.self)
          .attr('transform', `translate(0, ${this._getBarPosition(bar.index)})`);
      }
    });
  },

  _resizeSvg() {
    const { barHeight, barMargin } = this.activeProfile;
    this.barSvg.attr('height', `${(barHeight + barMargin) * this.sortedEntities.length}px`);
  },

  _scroll(duration = 0) {
    const follow = this.barContainer.select('.vzb-selected');
    if (!follow.empty()) {
      const d = follow.datum();
      const yPos = this._getBarPosition(d.index);

      const { margin } = this.activeProfile;
      const height = this.height - margin.top - margin.bottom;

      const scrollTo = yPos - (height + this.activeProfile.barHeight) / 2;
      this.barViewport.transition().duration(duration)
        .tween('scrollfor' + d.entity, this._scrollTopTween(scrollTo));
    }
  },

  _createAndDeleteBars(updatedBars) {
    const _this = this;

    // TODO: revert this commit after fixing https://github.com/vizabi/vizabi/issues/2450
    const [entity] = this.sortedEntities;
    if (!this._entityLabels[entity.entity]) {
      this._entityLabels[entity.entity] = entity.label;
    }

    const localeChanged = this._entityLabels[entity.entity] !== this.values.label[entity.entity]
      && this.model.locale.id !== this._localeId;

    if (localeChanged) {
      this._localeId = this.model.locale.id;
      this._entityLabels[entity.entity] = this.values.label[entity.entity];
    }

    // remove groups for entities that are gone
    updatedBars.exit().remove();

    // make the groups for the entities which were not drawn yet (.data.enter() does this)
    updatedBars = (localeChanged ? updatedBars : updatedBars.enter().append('g'))
      .each(function(d) {
        const self = d3.select(this);

        const labelFull = _this.values.label[d.entity];
        const labelSmall = labelFull.length < 12 ? labelFull : `${labelFull.substring(0, 9)}...`;

        const selectedLabel = self.select('.vzb-br-label');
        const barLabel = selectedLabel.size() ?
          selectedLabel :
          self.append('text')
            .attr('class', 'vzb-br-label')
            .attr('dy', '.325em');

        const labelFullWidth = barLabel.text(labelFull).node().getBBox().width;
        const labelSmallWidth = barLabel.text(labelSmall).node().getBBox().width;

        Object.assign(d, {
          labelFullWidth,
          labelSmallWidth,
          labelFull,
          labelSmall,
          barLabel,
        });

        if (!localeChanged) {
          self
            .attr('class', 'vzb-br-bar')
            .classed('vzb-selected', _this.model.marker.isSelected(d))
            .attr('id', `vzb-br-bar-${d.entity}-${_this._id}`)
            .on('mousemove', d => _this.model.marker.highlightMarker(d))
            .on('mouseout', () => _this.model.marker.clearHighlighted())
            .on('click', d => {
              _this.model.marker.selectMarker(d);
            });

          const barRect = self.append('rect')
            .attr('stroke', 'transparent');

          const barValue = self.append('text')
            .attr('class', 'vzb-br-value')
            .attr('dy', '.325em');

          Object.assign(d, {
            self,
            isNew: true,
            barRect,
            barValue,
          });
        }
      })
      .merge(updatedBars);
  },

  _getWidestLabelWidth(big = false) {
    const widthKey = big ? 'labelFullWidth' : 'labelSmallWidth';
    const labelKey = big ? 'labelFull' : 'labelSmall';

    const bar = this.sortedEntities
      .reduce((a, b) => a[widthKey] < b[widthKey] ? b : a);

    const text = bar.barLabel.text();
    const width = bar.barLabel.text(bar[labelKey]).node().getBBox().width;
    bar.barLabel.text(text);

    return width;
  },

  _drawColors() {
    const _this = this;

    this.barContainer.selectAll('.vzb-br-bar>rect')
      .each(function({ entity }) {
        const rect = d3.select(this);

        const colorValue = _this.values.color[entity];
        const isColorValid = colorValue || colorValue === 0;

        const fillColor = isColorValid ? String(_this._getColor(colorValue)) : COLOR_WHITEISH;
        const strokeColor = isColorValid ? 'transparent' : COLOR_BLACKISH;

        rect.style('fill') !== fillColor && rect.style('fill', fillColor);
        rect.style('stroke') !== strokeColor && rect.style('stroke', strokeColor);
      });

    this.barContainer.selectAll('.vzb-br-bar>text')
      .style('fill', ({ entity }) => this._getDarkerColor(this.values.color[entity] || null));
  },

  _getColor(value) {
    return d3.rgb(this.cScale(value));
  },

  _getDarkerColor(d) {
    return this._getColor(d).darker(2);
  },


  /**
   * DATA HELPER FUNCTIONS
   */

  _scrollTopTween(scrollTop) {
    return function() {
      const node = this, i = d3.interpolateNumber(this.scrollTop, scrollTop);
      return function(t) {
        node.scrollTop = i(t);
      };
    };
  },

  _getBarPosition(i) {
    return (this.activeProfile.barHeight + this.activeProfile.barMargin) * i;
  },

  _entities: {},

  _sortByIndicator(values) {
    return Object.keys(values).map(entity => {
      const cached = this._entities[entity];
      const value = values[entity];
      const label = this.values.label[entity];
      const formattedValue = this._formatter(value);

      if (cached) {
        return Object.assign(cached, {
          value,
          label,
          formattedValue,
          changedValue: formattedValue !== cached.formattedValue,
          changedWidth: value !== cached.value,
          isNew: false
        });
      }

      return this._entities[entity] = {
        entity,
        value,
        formattedValue,
        [this.model.entities.dim]: entity,
        changedValue: true,
        changedWidth: true,
        isNew: true
      };
    }).sort(({ value: a }, { value: b }) => b - a)
      .map((entity, index) =>
        Object.assign(entity, {
          index,
          changedIndex: index !== entity.index
        }));
  },

  _selectBars() {
    const entityDim = this.model.entities.dim;
    const selected = this.model.marker.select;

    // unselect all bars
    this.barContainer.classed('vzb-dimmed-selected', false);
    this.barContainer.selectAll('.vzb-br-bar.vzb-selected').classed('vzb-selected', false);

    // select the selected ones
    if (selected.length) {
      this.barContainer.classed('vzb-dimmed-selected', true);
      selected.forEach(selectedBar => {
        this.barContainer
          .select(`#vzb-br-bar-${selectedBar[entityDim]}-${this._id}`)
          .classed('vzb-selected', true);
      });
    }

  },

  _updateOpacity() {
    const { model: { marker } } = this;

    const OPACITY_HIGHLIGHT_DEFAULT = 1;
    const {
      highlight,
      select,

      opacityHighlightDim: OPACITY_HIGHLIGHT_DIM,
      opacitySelectDim: OPACITY_SELECT_DIM,
      opacityRegular: OPACITY_REGULAR,
    } = marker;

    const [
      someHighlighted,
      someSelected
    ] = [
      highlight.length > 0,
      select.length > 0
    ];

    this.barContainer.selectAll('.vzb-br-bar')
      .style('opacity', d => {
        if (someHighlighted && marker.isHighlighted(d)) {
          return OPACITY_HIGHLIGHT_DEFAULT;
        }

        if (someSelected) {
          return marker.isSelected(d) ? OPACITY_REGULAR : OPACITY_SELECT_DIM;
        }

        if (someHighlighted) {
          return OPACITY_HIGHLIGHT_DIM;
        }

        return OPACITY_REGULAR;
      });
  },

  _updateDoubtOpacity(opacity) {
    this.dataWarningEl.style('opacity',
      opacity || (
        !this.model.marker.select.length ?
          this.wScale(+this.model.time.value.getUTCFullYear().toString()) :
          1
      )
    );
  },

});

export default BarRankChart;
