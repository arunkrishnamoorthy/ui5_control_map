sap.ui.define(["sap/ui/layout/VerticalLayout", "sap/ui/thirdparty/d3"], function(Control, d3) {

	/**
	 * Constructor
	 *
	 */
	return Control.extend("de.tammenit.controls.svg.Map", (function() {
		var that;

		/**
		 * Provides the properties and events of the control DataTile
		 */
		function getMetadata() {
			return {
				properties: {
					"title": {
						type: "string",
						defaultValue: ""
					},
					"subTitle": {
						type: "string",
						defaultValue: ""
					},
					"colorpalette": {
						type: "string",
						defaultValue: "Reds"
					},
					"colorChangeValues": {
						type: "int[]"
					},
					"svgFileName": {
						type: "string",
						defaultValue: ""
					},
					"license": {
						type: "Object"
					},
					"codePropertyName": {
						type: "string"
					},
					"quantityPropertyName": {
						type: "string"
					},
					"descriptionPropertyName": {
						type: "string"
					},
					"standardFillColor": {
						type: "string",
						defaultValue: "#CDCDCD"
					},
					"tooltipText1": {
						type: "string"
					},
					"tooltipText2": {
						type: "string"
					},
					"tooltipText3": {
						type: "string"
					}
				},
				aggregations: {
					// html-control as container for the SVG control 
					_html: {
						type: "sap.ui.core.HTML",
						multiple: false,
						visibility: "hidden"
					},
					// data aggregation storing the data-binding of this control
					data: {
						type: "sap.ui.core.Element"
					}
				},
				events: {}
			};
		}

		function init() {
			that = this;
			// create _html control as aggregation
			this._sContainerId = this.getId() + "--container";
			this.setAggregation("_html", new sap.ui.core.HTML({
				content: "<div id='" + this._sContainerId + "' class='sapUiSmallMargin'></div>"
			}));
		}

		/**
		 * Renders the control based on the properties.
		 *
		 * @param oRm
		 * @param oControl
		 */
		function renderer(oRm, oControl) {
			if (oControl.getTitle()) {
				oRm.write("<h2 style='text-align:center'>" + oControl.getTitle() + "</h2>");
			}
			if (oControl.getSubTitle()) {
				oRm.write("<h3 style='text-align:center'>" + oControl.getSubTitle() + "</h2>");
			}

			// render the _html container control
			oRm.renderControl(oControl.getAggregation("_html"));
			
			// show license information for the graphi or whatever
			if (oControl.getLicense()) {
				var licObj = oControl.getLicense();
				oRm.write(
					'<div style="font-size:9px;">' + licObj.preText + ' <a href= ' + licObj.ownerLink + ' target="blank">' + licObj.owner + '</a>, ' +
					'License: <a href=' + licObj.licenseLink + ' target="blank">' + licObj.licenseText + '</a>, ' +
					licObj.srcPreText + ' <a href=' + licObj.srcLink + ' target="blank">' + licObj.srcText + '</a><div>'
				);
			}
		}

		/**
		 * Renders the SVG. Read here https://bost.ocks.org/mike/bar/3/ to understand what happens here
		 */
		function _renderSVG() {
			var range = this.colorTheme[9];

			// define a color scale to change the color of a country according to number of attendees
			var colorScale = d3.scale.linear()
				.domain(this.getColorChangeValues()) // change color at this values
				.range(range);

			// read the data from databinding into a flat array
			var chartData = this.getBinding("data").getContexts().map(function(oContext) {
				return oContext.getObject();
			});
			// set the color and tooltip for each country in the chartData read from the backend 
			chartData.forEach(function(chartObj) {
				var countryTag = d3.select("#" + chartObj[this.getCodePropertyName()]);
				if (chartObj[this.getQuantityPropertyName()] != 0) {
					countryTag.style("fill", this.getStandardFillColor()) // set fill color of the country initially to gray
					// change the color slowly to the color that corresponds to the quantity (Wow!!!) 
					.transition().duration(5000).style("fill", colorScale(chartObj[this.getQuantityPropertyName()]))
						.style("opacity", 1.0)
						.style("stroke", "black"); // the border is painted in black
				} else {
					// set opacity of background color to 20% if no attendee is there for a country
					countryTag.style("opacity", 1)
						.style("fill", this.getStandardFillColor())
						.style("stroke", "white")
						.transition().duration(5000)
						.style("opacity", 0.2)
						.style("stroke", "black");
				}
				// set a tooltip for each country		 		
				var countrySel = countryTag.selectAll("title").data([1]);

				countrySel.enter()
					.append("title");
				countrySel.text(this.getTooltipText1() + chartObj[this.getQuantityPropertyName()] + this.getTooltipText2() + chartObj[this.getDescriptionPropertyName()] + this.getTooltipText3());
			}.bind(this));
		}

		function onAfterRendering() {

			// if no svg-element currently exists we load the svg from a file and
			// add it to html-container.
			if (d3.select("svg").empty()) {
				// load the svg
				var oSVG = jQuery.sap.syncGetText("../" + this.getSvgFileName());
				var domSVG = jQuery(oSVG.data);
				// ... and append it to the html container control
				d3.select("#" + this._sContainerId)
					.node().appendChild(domSVG[domSVG.length - 1]);

				// retrieve the colortheme from the according control property
				this.colorTheme = colorbrewer[this.getColorpalette()];
				if (!this.colorTheme) {
					this.colorTheme = colorbrewer['Reds'];
				}

				// watch the change event of the data-binding and call the _renderSVG function
				// on change
				this.getBinding("data").attachChange(function() {
					that._renderSVG();
				});
			}

			_setControlHeight();
			jQuery(window).resize(_setControlHeight);
		}

		/**
		 * Sets the height of the control to the height of the window - 250.
		 * The new height is set at the #plantViewContainer div element that wraps the svg graphic
		 * @private
		 */
		function _setControlHeight() {
			var newHeight = jQuery(window).height() - 250;
			jQuery('#' + that._sContainerId).height(newHeight);
		}

		return {
			init: init,
			metadata: getMetadata(),
			renderer: renderer,
			_renderSVG: _renderSVG,
			onAfterRendering: onAfterRendering
		};
	}()));
}, true);