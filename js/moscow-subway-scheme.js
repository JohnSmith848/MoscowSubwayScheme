//$(function(){
    //Создание карты
    var map02=L.map("map-02",{
        crs: L.CRS.Simple,
        minZoom:0,
        maxZoom:5,
        attributionControl:false,
        maxBounds:[[0,0],[2080,1920]],
        maxBoundsViscosity:1,
    });
    let mapBounds=[[0,0],[2080,1920]];
    let baseEmptyImage=L.imageOverlay("img/MSSchemeEmpty.png",mapBounds).addTo(map02);
    let curZoom=0;
    let debugMode=true;
    
    L.Control.Legend = L.Control.extend({
        onAdd: function(map) {
            let ctrl = L.DomUtil.get('map-legend-01');
            let ctrlClose = L.DomUtil.get('map-legend-close-btn');
            L.DomEvent.on(ctrlClose,'click',function(){
                if(L.DomUtil.hasClass(ctrl,'minimize')){
                    L.DomUtil.removeClass(ctrl,'minimize');
                    L.DomUtil.removeClass(ctrlClose,'invert');
                }else{
                    L.DomUtil.addClass(ctrl,'minimize');
                    L.DomUtil.addClass(ctrlClose,'invert');
                }
            });
            return ctrl;
        },
        onRemove: function(map) {
            // 
        }
    });

    L.control.legend = function(opts) {
        return new L.Control.Legend(opts);
    }

    let legend=L.control.legend({ position: 'bottomleft' }).addTo(map02);
    
    map02.setView([1048,916],curZoom);//1048,916
    
    map02.on("zoom", function(ev){
        curZoom=ev.target.getZoom();
        reZoom();
    });

    let lineWidth,stationRadius,crossingWidth,crossingBorder,hollowlineInt
    let lineLayer = L.featureGroup();
    let stationLayer = L.featureGroup();
    let crossingLayer = L.featureGroup();
    let nameLayer = L.featureGroup();
    function reZoom(){
        console.log(curZoom);
        switch (curZoom){
            case 0:
                hollowlineInt=2;
                lineWidth=3;
                lineOverpassWidth=lineWidth+2;
                stationRadius=3;
                stationOverpassRadius=stationRadius+2;
                crossingWidth=6;
                crossStationWidth=2;
                crossingBorder=3;
                crossingRadius=4;
                break
            case 1:
                hollowlineInt=5;
                lineWidth=7;
                lineOverpassWidth=lineWidth+4;
                stationRadius=3;
                stationOverpassRadius=stationRadius+1.5;
                crossingWidth=15;
                crossStationWidth=4;
                crossingBorder=4;
                crossingRadius=4;
                break
            case 2:
                hollowlineInt=8;
                lineWidth=14;
                lineOverpassWidth=lineWidth+8;
                stationRadius=3;
                stationOverpassRadius=stationRadius+1.5;
                crossingWidth=30;
                crossStationWidth=6;
                crossingBorder=5;
                crossingRadius=4;
                break
        }
        subwayRender();
    }
    reZoom();

    function subwayRender(){
        let swFragment,swFragment1,swFragment2,swName,swNameMarker,curColor,curLine,curOpacity;
        let points=[];

        //clear all overlay layers
        lineLayer.clearLayers();
        stationLayer.clearLayers();
        crossingLayer.clearLayers();
        nameLayer.clearLayers();

        for (let swObject in subwayMscInfo){
            if(subwayMscInfo[swObject].type==="crossing"||subwayMscInfo[swObject].type==="crossing-estimated"){
                for (let st of subwayMscInfo[swObject].stations){
                    subwayMscInfo[st].cashInCrossing=true;
                }
            }
        }
        for (let swObject in subwayMscInfo){
            //define line
            curLine=swObject.slice(0,2);
            //define color
            curColor=subwayMscMetaInfo[curLine];
            //define opacity
            if(subwayMscInfo[swObject].sOpacity){
                curOpacity=subwayMscInfo[swObject].sOpacity;
            }else{
                curOpacity=1;
            }
            switch (subwayMscInfo[swObject].type){
                case "station":
                case "station-estimated":
                case "station-closed":
                    //station drawing
                    if(!subwayMscInfo[swObject].sCoord){break}
                    swFragment=L.circle(subwayMscInfo[swObject].sCoord, {radius:stationRadius,color:'white',weight:1,fillColor:curColor,opacity:curOpacity,fillOpacity:curOpacity,});
                    stationLayer.addLayer(swFragment).addTo(map02);
                    if(subwayMscInfo[swObject].type==='station-estimated'){
                        swFragment1=L.circle(subwayMscInfo[swObject].sCoord, {radius:stationRadius-2, stroke:false,fillColor:'white',opacity:curOpacity,fillOpacity:curOpacity,});
                        stationLayer.addLayer(swFragment1).addTo(map02);
                        swFragment1.bindTooltip(getTooltipStation(swObject,subwayMscInfo[swObject]));
                    }else if(subwayMscInfo[swObject].type==='station-closed'){
                        swFragment1=L.circle(subwayMscInfo[swObject].sCoord, {radius:stationRadius-2, stroke:false,fillColor:'black',opacity:curOpacity,fillOpacity:curOpacity,});
                        stationLayer.addLayer(swFragment1).addTo(map02);
                        swFragment1.bindTooltip(getTooltipStation(swObject,subwayMscInfo[swObject]));
                    }
                    swFragment.bindTooltip(getTooltipStation(swObject,subwayMscInfo[swObject]));
                    //station naming
                    if (subwayMscInfo[swObject].sDoubling&&subwayMscInfo[swObject].sDoubling===true){break}
                    let AddNameClass='';
                    if (subwayMscInfo[swObject].sAddNameClass){AddNameClass=subwayMscInfo[swObject].sAddNameClass}
                    if (subwayMscInfo[swObject].hyperlink){
                        swName=L.divIcon({
                            className:'map-station-name '+curLine+' '+AddNameClass,
                            html:'<div class="map-station-name-wrap zoom'+curZoom+'" style="opacity:'+ curOpacity +'"><a href="'+subwayMscInfo[swObject].hyperlink+'">'+subwayMscInfo[swObject].name+'</a></div>'});
                    }else{
                        swName=L.divIcon({className:'map-station-name '+curLine+' '+AddNameClass,html:'<div class="map-station-name-wrap zoom'+curZoom+'" style="opacity:'+ curOpacity +'">'+subwayMscInfo[swObject].name+'</div>'});
                    }
                     swNameMarker=L.marker([
                         subwayMscInfo[swObject].sCoord[0]+subwayMscInfo[swObject].sNameOffset[0],// /(2**(curZoom))
                         subwayMscInfo[swObject].sCoord[1]+subwayMscInfo[swObject].sNameOffset[1],// /(2**(curZoom))
                     ],{icon:swName});
                     nameLayer.addLayer(swNameMarker).addTo(map02);
                    break;
                case "crossing":
                case "crossing-estimated":
                    points=[];
                    for (let st of subwayMscInfo[swObject].stations){
                        points.push(subwayMscInfo[st].sCoord);
                    }
                    let crossingWeight=5;
                    swFragment = L.polygon(points, {className:'g',weight:crossingWidth+crossingBorder,color:'black',opacity:curOpacity,fillOpacity:curOpacity,});
                    crossingLayer.addLayer(swFragment).addTo(map02);
                    swFragment = L.polygon(points, {className:'g',weight:crossingWidth,color:'white',fillOpacity:1,});
                    crossingLayer.addLayer(swFragment).addTo(map02);
                    //paint cross-platform stations
                    for (let st of subwayMscInfo[swObject].stations){
                        points=[];
                        if(subwayMscInfo[st].crossWith&&subwayMscInfo[st].crossWith!==''){
                            console.log(subwayMscInfo[st].crossWith);
                            points.push(subwayMscInfo[st].sCoord);
                            points.push(subwayMscInfo[subwayMscInfo[st].crossWith].sCoord);
                            swFragment=L.polyline(points, {color:'grey', weight:crossStationWidth,opacity:curOpacity,fillOpacity:curOpacity});
                            crossingLayer.addLayer(swFragment).addTo(map02);
                        }
                    }
                    break;
                case "crossingOnNull":
                    for (let p of subwayMscInfo[swObject].stations){
                        swFragment = L.polyline([subwayMscInfo[p[0]].sCoord,subwayMscInfo[p[1]].sCoord], {className:'g',weight:crossingBorder-1, color:'#999999',opacity:curOpacity,fillOpacity:curOpacity,fillColor:'#999999',dashArray:(crossingBorder-2)+' '+(crossingBorder+1)});
                        crossingLayer.addLayer(swFragment).addTo(map02);
                        if(!subwayMscInfo[p[0]].cashInCrossing){
                            swFragment = L.circle(subwayMscInfo[p[0]].sCoord, {className:'g',radius:crossingRadius,weight:crossingBorder-2,color:'black',fillColor:'white',fillOpacity:1,});
                            crossingLayer.addLayer(swFragment).addTo(map02);
                        }
                        if(!subwayMscInfo[p[1]].cashInCrossing){
                            swFragment = L.circle(subwayMscInfo[p[1]].sCoord, {className:'g',radius:crossingRadius,weight:crossingBorder-2,color:'black',fillColor:'white',fillOpacity:1,});
                            crossingLayer.addLayer(swFragment).addTo(map02);
                        }
                    }
                    break;
                case "line":
                    if(subwayMscInfo[swObject].sLineType==="ring"){
                        swFragment=L.circle(subwayMscInfo[swObject].sCenter, {radius:subwayMscInfo[swObject].sRadius, weight:lineWidth, color:curColor, fillColor:'transparent',opacity:curOpacity,fillOpacity:curOpacity,});
                    }else if(subwayMscInfo[swObject].sLineType==="line"){
                        //Draw an overpass fragment
                        if(subwayMscInfo[swObject].sOverpass){
                            console.log(subwayMscInfo[swObject]);
                            //let aOvp=subwayMscInfo[swObject].sOverpass;
                            for (let ovpFrag of subwayMscInfo[swObject].sOverpass){
                                //let ovpFrag=subwayMscInfo[swObject].sOverpass[ovpFragKey];
                                console.log(ovpFrag);
                                let prevSt='';
                                for (let ovpSt of ovpFrag){
                                    if(prevSt!==''){
                                        swFragment=L.polyline([subwayMscInfo[prevSt].sCoord,subwayMscInfo[ovpSt].sCoord], {color:'black', weight:lineOverpassWidth,opacity:curOpacity,fillOpacity:curOpacity});
                                        lineLayer.addLayer(swFragment).addTo(map02);
                                    }
                                    console.log(ovpSt);
                                    swFragment=L.circle(subwayMscInfo[ovpSt].sCoord, {radius:stationOverpassRadius, stroke:false,fillColor:'black',opacity:curOpacity,fillOpacity:curOpacity,});
                                    lineLayer.addLayer(swFragment).addTo(map02);
                                    prevSt=ovpSt;
                                }
                            }
                        }
                        swFragment=L.polyline(subwayMscInfo[swObject].sCoord, {color:curColor, weight:lineWidth,opacity:curOpacity,fillOpacity:curOpacity});
                    }else if(subwayMscInfo[swObject].sLineType==="hollow-line"){
                        swFragment=L.polygon(subwayMscInfo[swObject].sCoord, {color:curColor, weight:1,fillColor:'white',fillOpacity:1,});
                    }else if(subwayMscInfo[swObject].sLineType==="hollow-ring"){
                        swFragment=L.circle(subwayMscInfo[swObject].sCenter, {radius:subwayMscInfo[swObject].sRadius+1.5, weight:1.5, color:curColor, fillColor:'transparent',opacity:curOpacity,fillOpacity:curOpacity,});
                        swFragment1=L.circle(subwayMscInfo[swObject].sCenter, {radius:subwayMscInfo[swObject].sRadius+5, weight:1.5, color:curColor, fillColor:'transparent',opacity:curOpacity,fillOpacity:curOpacity,});
                        lineLayer.addLayer(swFragment1).addTo(map02);
                        swFragment2=L.circle(subwayMscInfo[swObject].sCenter, {radius:subwayMscInfo[swObject].sRadius+3.5, weight:hollowlineInt, color:'white', fillColor:'transparent',opacity:curOpacity,fillOpacity:curOpacity,});
                        lineLayer.addLayer(swFragment2).addTo(map02);
                    }
                    //swFragment.bindTooltip(getTooltipLine(swObject,subwayMscInfo[swObject]));
                    lineLayer.addLayer(swFragment).addTo(map02);
                    break;
                case "line-estimated":
                    if(subwayMscInfo[swObject].sLineType==="ring"){
                        swFragment=L.circle(subwayMscInfo[swObject].sCenter, {radius:subwayMscInfo[swObject].sRadius, weight:lineWidth, color:curColor, fillColor:'transparent',opacity:curOpacity,fillOpacity:curOpacity,});
                    }else if(subwayMscInfo[swObject].sLineType==="line"){
                        swFragment=L.polyline(subwayMscInfo[swObject].sCoord, {color:curColor, weight:lineWidth,opacity:curOpacity,fillOpacity:curOpacity,dashArray:(lineWidth-2)+' '+(lineWidth+2)});
                    }else if(subwayMscInfo[swObject].sLineType==="hollow-line"){
                        swFragment=L.polygon(subwayMscInfo[swObject].sCoord, {color:curColor, weight:1,fillColor:'white',fillOpacity:1,});
                    }else if(subwayMscInfo[swObject].sLineType==="hollow-ring"){
                        swFragment=L.circle(subwayMscInfo[swObject].sCenter, {radius:subwayMscInfo[swObject].sRadius+1.5, weight:1.5, color:curColor, fillColor:'transparent',opacity:curOpacity,fillOpacity:curOpacity,});
                        swFragment1=L.circle(subwayMscInfo[swObject].sCenter, {radius:subwayMscInfo[swObject].sRadius+5, weight:1.5, color:curColor, fillColor:'transparent',opacity:curOpacity,fillOpacity:curOpacity,});
                        lineLayer.addLayer(swFragment1).addTo(map02);
                        swFragment2=L.circle(subwayMscInfo[swObject].sCenter, {radius:subwayMscInfo[swObject].sRadius+3.5, weight:hollowlineInt, color:'white', fillColor:'transparent',opacity:curOpacity,fillOpacity:curOpacity,});
                        lineLayer.addLayer(swFragment2).addTo(map02);
                    }
                    lineLayer.addLayer(swFragment).addTo(map02);
                    break;
            }
        }
    }
    function getTooltipStation(stationKey,station){
        let res =
            '<div class="map-tooltip__wrapper">'+
                '<h1 class="map-tooltip__header">'+deBRation(station.name)+'</h1>';
        if(debugMode){res+='<p class="map-tooltip__debug-info">Внутренний идентификатор: '+stationKey+'</p>'}
        if(station.img&&station.img!==''){res+='<img class="map-tooltip__img" src="img/stations/'+station.img+'"/>'}
        if(station.desc&&station.desc!==''){res+='<p class="map-tooltip__desc"><span class="map-tooltip__subheader">Описание</span><br/>'+station.desc+'<p/>'}
        if(station.from&&station.from!==''){res+='<p class="map-tooltip__desc"><span class="map-tooltip__subheader">Открытие</span><br/>'+station.from+'<p/>'}
        if(station.depth&&station.depth!==''){res+='<p class="map-tooltip__desc"><span class="map-tooltip__subheader">Глубина залегания</span> '+station.depth+'<p/>'}
        if(station.buildingType&&station.buildingType!==''){res+='<p class="map-tooltip__desc"><span class="map-tooltip__subheader">Тип постройки</span><br/>'+station.buildingType+'<p/>'}
        res+='</div>';
        //console.log(res);
        return res
    }
    function deBRation(string){
        let res='',a=string.split('<br/>');
        for (w in a){
            res+=a[w]+' ';
        }
        return res
    }
    function getTooltipLine(lineKey,line){
        let res =
            '<div class="map-tooltip__wrapper">'+
                '<h1 class="map-tooltip__header">'+line.name+'</h1>';
        res+='</div>';
        return res
    }

//});

