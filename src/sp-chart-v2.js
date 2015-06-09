(function(document, d3, $){	
	var viewModels = [];
	/* 清除空白 */
	var clearWhitespace = function(str){
		return str.replace(/\s/g,"");
	};
	/**是否為小數點*/
	var isFloat = function(n){
		return n % 1 !== 0;
	};

	var formatStr = function(val){
		return (val * 100 | 0) / 100;
	};

	//---------------------------
	// 資料模組 M
	//---------------------------
	var ChartModel = function(source, opt){
		var base = ChartModel.prototype,
			data = source,
			defaultOption = {
				//stage
				viewPort : '100%, 100%',		//svg長寬。 width height
				viewBox : '0,0,600,600',		//svg選擇顯示範圍，如同攝影機的攝影範圍。 x,y,width,height
				preserveAspectRatio : "none",	//svg zoom mode
				chart : {width:'100%', height:'100%'},
				axisZoom : 0.85,								//縮放比,1不縮放,起點會從 (0,0)開始
				zoomW : 0.9,
				zoomH : 0.7,
				maxValue : 100,								//軸的最大值
				minValue : 0,								//軸的最小值
				scaleY : [0, 50, 75, 100],					//Y軸刻度值  固定四個不要亂改
				scaleX : [0, 0.5, 1.0],						//X軸刻度值  固定三個不要亂改
				radius : {rx:5, rx:5},						//最外框圓角
				backgroundColor : "#eeeeee",
				backgroundOpacity : 0.8,
				backgroundStroke : '#bdbdbd',
				backgroundStrokeWidth : 2,
				gridStroke : "#bdbdbd",						//網格線顏色
				gridStrokeWidth : 2,						//網格線粗細
				markRadius : 10,							//標記點半徑
				markColor : d3.scale.category20(),			//圓點顏色
				markOpacity : 0.7,
				markShowOpacity : 1,
				markStroke: "grey",
				markStrokeWidth : 1,
				//SP表分類
				generTextList : [
					["學習穩定型", "粗心大意型"],	//A區
					["努力不足型", "欠缺充分型"],	//B區
					["學力不足型", "學習異常型"]		//C區
				],
				generTextColor : '#757575',		//類型文字顏色
				generTextOpacity : 0.7,			//類型文字透明
				generFontSize : '20px',			//類型文字大小
				//置中調整用
				generOffsetY : -20,				//類型文字偏移
				generOffsetX : 110,				//類型文字偏移
				//刻度文字
				scaleTextColor : 'black',
				scaleTextOpacity : 1,
				scaleFontSize : '14px',
				//刻度文字位置調整
				//S軸偏移
				scaleOffextY : 6,				//
				scaleOffextX : -45,
				//P軸偏移
				scaleOffsetPY : 30,
				scaleOffsetPX : -6,
				//toolTip
				tipBasicOffsetX : 0,		//tip 與 mark gap
				tipBasicOffsetY : -10,
				toolTipOpacity : 0,			//toolTip 只有  mouseOver才會顯示
				toolTipShowOpacity : 0.9,
				toolTipDefPoint : {x:0, y:0},
				toolTipW : 250,
				toolTipH : 70,
				toolTipBgColor : "white",
				toolTipStork: "#bdbdbd",	//邊框
				toolTipStrokeWidth: 1,		//粗細
				toolTipColor : "black",		//toolTip文字顏色
				toolTipRadius : {rx : 5, ry: 5},
				toolTipFontSize : '14px',
				toolTipTextOffsetX : 10,
				toolTipTextOffsetY : 20,
				toolTipTextGap : -2,
				toolTipTextOffsetSX : 14,
				toolTipTextOffsetSY : 18,
				toolTipTextOffsetPX : 14,
				toolTipTextOffsetPY : 18,
				pTitle : "學生的得分百分比 ：",
				sTitle : "學生注意係數 ："
			},
			options = null;

		base.mixOptions = function(opt){
			options = Object.create(defaultOption);
			if(opt && typeof opt !== 'string' && !(opt instanceof String) && typeof opt === "object"){
				for(var attr in opt){
					options[attr] = opt[attr]; 
				}
			}
		};

		/* 取得viewPort數值物件 */
		base.getViewPort = function(){
			var val = clearWhitespace(options.viewPort).split(',');
			return {
				width  : val[0],
				height : val[1]
			};
		};

		/* 取得viewbox數值物件 */
		base.getViewBoxValue = function(){
			var viewBox = (options) ? options.viewBox : defaultOption.viewBox;
			var val = clearWhitespace(viewBox).split(',');
			return {
				x : Number(val[0]),
				y : Number(val[1]),
				width  : Number(val[2]),
				height : Number(val[3])
			};
		}

		base.getOptions = function(){
			return options;
		};

		base.getParameter = function(){
			var viewBox = this.getViewBoxValue();
			var baseLength = Math.min(viewBox.height, viewBox.width) *  options.axisZoom;
			var halfW = baseLength * options.zoomW / 2;
			var halfH = baseLength * options.zoomH / 2;
			var centerX = viewBox.width  / 2;
			var centerY = viewBox.height / 2;
			return {
				width  : viewBox.width,
				height : viewBox.height,
				//取容器最小邊當作長度基準
				baseLength : baseLength,
				center : { x : centerX , y : centerY },
				halfW : halfW,
				halfH : halfH,
				//sp圖大小
				spWidth  : baseLength * options.zoomW,
				spHeight : baseLength * options.zoomH,
				//一格的大小
				cileSize : { 
					width : baseLength * options.zoomW / (options.scaleX.length -1),
					height: baseLength * options.zoomH / (options.scaleY.length -1)
				},
				//繪製起始點參考點
				refPoint : { x : centerX - halfW, y : centerY - halfH}
			};
		};

		var init = function(source, opt){
			base.mixOptions(opt);
		};
		init(source, opt);

		return {
			getData : function(){
				return data;
			},
			setData : function(value){
				if(data != value) data = value;
			},
			hasData : function(){
				return data && data.length > 0;
			},
			base : base
		}
	};

	//---------------------------
	// 事件處理模組
	//---------------------------
	var EventHandler = (function(document, d3, $){
		return{
			markMouseOver : function(e){
				var viewModel = e.viewModel;
				var info = e.info;
				var opt = viewModel.model.base.getOptions();
				var parameter = viewModel.model.base.getParameter();
				
				//mark
				var mark = d3.select(this);
					mark.attr('fill-opacity', opt.markShowOpacity);
				
				var cx = Number(mark.attr('cx')) - (opt.toolTipW / 2) + opt.tipBasicOffsetX;
				var cy = Number(mark.attr('cy')) - opt.markRadius - opt.toolTipH + opt.tipBasicOffsetY;
				
				var padding = 5;
				//處理水平超出邊界
				if(cx < 0){
					cx = padding;
				}else if( (cx + opt.toolTipW) > parameter.width){
					
					cx -= (cx + opt.toolTipW) - parameter.width + padding ;
				}
				//處理垂直超出邊界
				if(cy < 0){
					var overVal = 0 - cy;
					cy += overVal + padding;
				}
				
				//panel
				viewModel.toolTip.attr('opacity', opt.toolTipShowOpacity);
				
				//background
				viewModel.tipRec.attr('x', cx)
						 .attr('y', cy);
				//title
				viewModel.tipTitle.text(info.title)
					.attr('x', cx + opt.toolTipTextOffsetX )
					.attr('y', cy + opt.toolTipTextOffsetY );
				
				var valueS = Number(info.s);
				if(isFloat(valueS)){ valueS = formatStr(valueS);}
				//
				viewModel.tipS.text( opt.sTitle + valueS)
					.attr('x', cx + opt.toolTipTextOffsetX + opt.toolTipTextOffsetSX)
					.attr('y', cy + opt.toolTipTextOffsetY + opt.toolTipTextOffsetSY);
				
				//如果是浮點數，就只取兩位
				var valueP = Number(info.p) * 100;
				if(isFloat( valueP)) {valueP = formatStr(valueP);}
				//
				viewModel.tipP.text(opt.pTitle + valueP + '%')
					.attr('x', cx + opt.toolTipTextOffsetX + opt.toolTipTextOffsetPX)
					.attr('y', cy + opt.toolTipTextOffsetY + opt.toolTipTextOffsetSY + opt.toolTipTextOffsetPY + opt.toolTipTextGap);				
			},
			markMouseOut : function(e){
				var viewModel = e.viewModel;
				var info = e.info;
				var opt = viewModel.model.base.getOptions();
				var parameter = viewModel.model.base.getParameter();
				d3.select(this).attr('fill-opacity', opt.markOpacity);
				viewModel.toolTip.attr('opacity', opt.toolTipOpacity);
			}
		}
	})(document, d3, $);

	//---------------------------
	// 畫筆模組
	//---------------------------
	var ChartPan = (function(document, d3, $){		
		var renderToolTip = function(svg, parameter, opt, viewModel){
			//panel
			viewModel['toolTip'] = svg.append('g').attr('class', 'sp-toolTip-group').attr('opacity', opt.toolTipOpacity);			

			viewModel['tipRec']  = viewModel['toolTip'].append('rect');
			viewModel['tipRec'].attr('x' , opt.toolTipDefPoint.x)
							   .attr('y' , opt.toolTipDefPoint.y)
							   .attr('width', opt.toolTipW)
							   .attr('height', opt.toolTipH)
							   .attr('fill', opt.toolTipBgColor)
							   .attr('stroke', opt.toolTipStork)
							   .attr('stroke-width', opt.toolTipStrokeWidth)
							   .attr('rx', opt.toolTipRadius.rx)
							   .attr('ry', opt.toolTipRadius.ry)
							   .attr('pointer-events', 'none');
			//text title
			viewModel['tipTitle'] = viewModel['toolTip'].append('text').attr('class', 'sp-toolTip-title');
			viewModel['tipTitle'].text("")
								 .attr('x', opt.toolTipDefPoint.x + opt.toolTipTextOffsetX)
								 .attr('y', opt.toolTipDefPoint.y + opt.toolTipTextOffsetY)
								 .attr('fill', opt.scaleTextColor)
								 .attr('font-size', opt.toolTipFontSize)
								 .attr('pointer-events', 'none');
			
			//text S
			viewModel['tipS'] = viewModel['toolTip'].append('text').attr('class', 'sp-toolTip-s');
			viewModel['tipS'].text(" : ")
							 .attr('x', opt.toolTipDefPoint.x + opt.toolTipTextOffsetX + opt.toolTipTextOffsetSX)
							 .attr('y', opt.toolTipDefPoint.y + opt.toolTipTextOffsetY + opt.toolTipTextOffsetSY)
							 .attr('fill', opt.scaleTextColor)
							 .attr('font-size', opt.toolTipFontSize)
							 .attr('pointer-events', 'none');
			
			//text P
			viewModel['tipP']  = viewModel['toolTip'].append('text').attr('class', 'sp-toolTip-title-p');
			viewModel['tipP'].text(" : ")
							 .attr('x', opt.toolTipDefPoint.x + opt.toolTipTextOffsetX + opt.toolTipTextOffsetPX)
							 .attr('y', opt.toolTipDefPoint.y + opt.toolTipTextOffsetY + opt.toolTipTextOffsetSY + opt.toolTipTextOffsetPY + opt.toolTipTextGap)
							 .attr('fill', opt.scaleTextColor)
							 .attr('font-size', opt.toolTipFontSize)
							 .attr('pointer-events', 'none');
		};
		
		var renderMark = function(svg, parameter, opt, viewModel){
			var data = viewModel.model.getData();
			var g = svg.append('g').attr('class', 'sp-markGroup');
			//垂直軸所需數據
			var basicOne = parameter.cileSize.height * 2 / (opt.scaleY[3] - opt.scaleY[1]); //50 ~ 100
			var basicTwo = parameter.cileSize.height * 1 / (opt.scaleY[1] - opt.scaleY[0]); //0 ~ 50
			var bottom = (parameter.refPoint.y  + parameter.spHeight);
			var left = parameter.refPoint.x;
			//水平軸所需數據
			var basicThree = parameter.spWidth / (opt.scaleX[2] - opt.scaleX[0]);
			for(var i=0,c=data.length ; i < c ; i++){
				var p = data[i].p * 100; //垂直
				var s = data[i].s;		  //水平
				var point = {x:0, y :0};
				
				//y軸
				if(p >= opt.scaleY[1]){
					var length = (p - opt.scaleY[1])  * basicOne;
					point.y = bottom - parameter.cileSize.height - length;
				}else{
					var length = p * basicTwo;
					point.y = bottom - length;
				}
				//x軸
				point.x = left + (s *basicThree);
				
				g.append('circle')
				 .datum({viewModel : viewModel , info : data[i]})
				 .attr('cx', point.x )
				 .attr('cy', point.y )
				 .attr('r' , opt.markRadius)
				 .attr('fill', opt.markColor(i))
				 .attr('fill-opacity', opt.markOpacity)
				 .attr('stroke', opt.markStroke)
				 .attr('stroke-width', opt.markStrokeWidth)
				 .on('mouseover', EventHandler.markMouseOver)
				 .on('mouseout' , EventHandler.markMouseOut);
			}
		};

		/**繪製刻度*/
		var renderScale = function(svg, parameter, opt){
			var g = svg.append('g').attr('class', 'sp-scaleGroup');
			var top  = parameter.refPoint.y;
			var left = parameter.refPoint.x;
			//垂直軸
			for(var i = 0, row = opt.scaleY.length ; i < row ; i++ ){
				var rowY = (top + parameter.cileSize.height * i) + opt.scaleOffextY;
				var rowX = left + opt.scaleOffextX;
				g.append('g').append('text')
				 .text(opt.scaleY[row - i - 1] + "%")
				 .attr('x', rowX)
				 .attr('y', rowY)
				 .attr('fill', opt.scaleTextColor)
				 .attr('font-size', opt.scaleFontSize);
				
			}
			 //水平
			for(var j = 0, column = opt.scaleX.length ; j < column ; j++){
					var columnY = top + parameter.spHeight + opt.scaleOffsetPY;
					var columnX = (left + parameter.cileSize.width * j) + opt.scaleOffsetPX;
					var textValue = opt.scaleX[j];
					if(textValue == 0){ textValue = '0.' + textValue; }
					if(textValue == 1){ textValue = textValue + '.0'; }
					g.append('g').append('text')
				 	 .text(textValue)
				 	 .attr('x', columnX)
				 	 .attr('y', columnY)
				 	 .attr('fill', opt.scaleTextColor)
				 	 .attr('font-size', opt.scaleFontSize);
			}
		};
		
		/**繪製格線*/
		var renderGrid = function(svg, parameter, opt){
			var g = svg.append('g').attr('class', 'sp-gridGroup');
			var row    = opt.scaleY.length - 2;
			var column = opt.scaleX.length - 2;
			//水平線
			for(var i=1 ; i <= row ; i++){
				var y1 = parameter.cileSize.height * i + parameter.refPoint.y;
				var y2 = y1;
				g.append('line')
				 .attr('stroke', opt.gridStroke )
				 .attr('stroke-width', opt.gridStrokeWidth)
				 .attr('x1', parameter.refPoint.x)
				 .attr('y1', y1)
				 .attr('x2', parameter.refPoint.x + parameter.spWidth)
				 .attr('y2', y2);
			}
			//垂直線
			for(var i=1 ; i <= column ; i++){
				var x1 = parameter.cileSize.width * i + parameter.refPoint.x;
				var x2 = x1;
				g.append('line')
				 .attr('stroke', opt.gridStroke )
				 .attr('stroke-width', opt.gridStrokeWidth)
				 .attr('x1', x1)
				 .attr('y1', parameter.refPoint.y)
				 .attr('x2', x2)
				 .attr('y2', parameter.refPoint.y  + parameter.spHeight);
			}
		};

		/**繪製學習類型文字**/
		var renderGenreText = function(svg, parameter, opt){			
			var top  = parameter.refPoint.y;
			var left = parameter.refPoint.x;
			var pointX = 0;
			var pointY = 0;

			var g = svg.append('g').attr('class', 'sp-generTextGroup');
			
			for(var i=0, row=opt.generTextList.length ;  i < row ; i++ ){
				var rowTexts = opt.generTextList[i];
				pointY = (top + parameter.cileSize.height * i) + ((parameter.cileSize.height - opt.generOffsetY)  / 2);
				for(var j=0, column=opt.generTextList[0].length ; j < column ; j++ ){
					pointX = (left + parameter.cileSize.width *j) + ((parameter.cileSize.width - opt.generOffsetX)/ 2);
					g.append('text')
					 .text(rowTexts[j])
					 .attr('x', pointX)
					 .attr('y', pointY)
					 .attr('fill', opt.generTextColor)
					 .attr('font-size', opt.generFontSize)
					 .attr('pointer-events', 'none');
				}
			}
		};

		/**繪製背景（底層的矩行）*/
		var renderBackground = function(svg, parameter, opt){
			var g = svg.append('g').attr('class', 'sp-backgroundGroup');
				g.append('rect')
				 .attr('x', parameter.refPoint.x)
				 .attr('y', parameter.refPoint.y)
				 .attr('rx', opt.radius.rx)
				 .attr('ry', opt.radius.ry)
				 .attr('width' , parameter.baseLength * opt.zoomW)
				 .attr('height', parameter.baseLength * opt.zoomH)
				 .attr('fill', opt.backgroundColor)
				 .attr('fill-opacity', opt.backgroundOpacity)
				 .attr('stroke', opt.backgroundStroke)
				 .attr('stroke-width', opt.backgroundStrokeWidth);
		};

		/***/
		var createSVG = function(viewModel){
			var opt = viewModel.model.base.getOptions();
			var element = viewModel.element;
			//jquery處理
			var svg = $(element).append('<svg class="lineChart">').find('svg');
				svg.attr('width', opt.chart.width)
	      		svg.attr("height", opt.chart.height)
	      		svg.attr("viewBox",opt.viewBox)
	      		svg.attr("preserveAspectRatio", opt.preserveAspectRatio);
	      	return d3.select(svg[0]); //轉d3
		};
		return {	
			/**將標記移至最上層*/
			markToFirstLayer : function(){
			},
			renderChart : function(viewModel){
				var svg = createSVG(viewModel);
				var parameter = viewModel.model.base.getParameter();
				var opt = viewModel.model.base.getOptions();
				viewModel['svg'] = svg;
				renderBackground(svg, parameter, opt);
				renderGenreText(svg, parameter, opt);
				renderGrid(svg, parameter, opt);
				renderScale(svg, parameter, opt);
				renderMark(svg, parameter, opt, viewModel);
				renderToolTip(svg, parameter, opt, viewModel);
			}
		}
	})(document, d3, $);

	//---------------------------
	// 圖表畫家 （controler）
	//---------------------------
	var SP_ChartPainter = (function(document, d3, $){
			/**清除SVG內容*/
			clearSVG = function(identity){
				//d3.select(identity).select('svg').remove();
			},
			/**檢查是否可以註冊*/
			canRegister = function(identity){
				var elements = $(identity);
				var pass = true;
				for(var i=0, l=elements.length ; i < l ; i++){
					for(var c=0, size=viewModels.length ; c < size ; c++){
						if(elements[i] === viewModels[c]['element']){
							pass = false;
							break;
						}
					}
				}
				return pass;
			},
			/**註冊*/
			registerChart = function(identity, element, data, options){
				var viewModel = {identity : identity, element : element, model : new ChartModel(data, options)};
					viewModels.push(viewModel);
				return viewModel;
			},
			/**解除註冊*/
			unRegisterChart = function(identity){
				var elements = $(identity);
				for(var i=elements.length-1 ; i > -1 ; i--){
					for(var c=viewModels.length-1 ; c > -1 ; c--){
						if(elements[i] === viewModels[c]['element']){
							viewModels[c].identity = null;
							viewModels[c].element = null;
							viewModels[c].model = null;
							viewModels[c] = null
							viewModels.splice(c,1);
						}
					}
				}
			};
		return {
				drawChart : function(identity, data, options){
					if(canRegister(identity)){
						var elements = $(identity);
						for(var i=0, l=elements.length ; i < l ; i++){
							var viewModel = registerChart(identity,  elements[i], data, options);
							ChartPan.renderChart(viewModel);
						}
					}
				},
				clearChart : function(identity){
					unRegisterChart(identity);
					clearSVG(identity);
				}
		};
	})(document, d3, $);

	//---------------------------
	//
	//---------------------------
	if(!window.SP_ChartPainter){
		window.SP_ChartPainter = SP_ChartPainter;
	}

	if(typeof(module)!= "undefined"){
		module.exports = SP_ChartPainter;
	}
}).call(this, document, d3, $);