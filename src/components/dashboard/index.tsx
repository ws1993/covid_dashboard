import * as React from 'react';
import './index.scss';
import { IDefaultProps } from '../../global';
import { IRegionEpidemicDayData, IRegionInfo, ITimeline, IEpidemicData } from '../../models';
import DBBlock from './dbblock';
import { displayNumber } from '../../utils/data';
import { risk2color } from '../../utils/color';
import ReactEcharts from 'echarts-for-react';
import MapModeSelector from '../map/map-mode-selector';
import { Popover, Tooltip } from 'antd';
import { FormattedMessage} from 'react-intl';

interface IProps extends IDefaultProps{
  regionInfo: IRegionInfo
  dayEp: Partial<IRegionEpidemicDayData>
  onChangeTime: (d: Date) => void
  onChangeSpeed: (speed: number) => void
  endDate: Date
  mapMode: string, 
  onSetMapMode: (mode: string) => void
}

interface IState {

}

export default class DashBoard extends React.Component<IProps, IState> {
  private _upHeight: number = 100;
  private _leftWidth: number = 180;
  private _leftWidth_m: number = 160;
  private _rightupHeight: number = 36;
  private _rightdownHeight: number;
  private _blockMargin: number = 2;
  private _dataWidth: number = 106;
  private _riskWidth: number;

  constructor(props: IProps) {
    super(props);
    this.state = {

    }
    this._rightdownHeight = this._upHeight - this._blockMargin - this._rightupHeight;
    this._riskWidth = 3 * this._dataWidth + 2 * this._blockMargin;
  }

  private riskOption() {
    let option: any = {};
    const { epData, regionInfo } = this.props;
    if(epData && regionInfo) {
      let name = regionInfo.name == 'World' ? "" : regionInfo.name;
      let regionData: ITimeline<IEpidemicData> | null = epData[name] || null;
      let worldData: ITimeline<IEpidemicData> = epData[""];
      if(regionData) {
        let keys: string[] = Object.keys(regionData);
        if(keys.length > 20) keys = keys.slice(-20);
        option = {
          grid: {
            left: "0%",
            right: "0%",
            top: '0%',
            bottom: "0%"
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            show: false
          },
          xAxis: {
            type: 'category',
            boundaryGap: false, 
            data: keys
          },
          yAxis: {
            show: false,
            type: 'value',
            splitLine: {
              show: false
            },
            max: 100,
            min: 0,
            interval: 20
          },
          visualMap: {
            show: false,
            pieces: [
              {
                gt: 0,
                lte: 20,
                color: risk2color(10)
              }, {
                  gt: 20,
                  lte: 40,
                  color: risk2color(30)
              }, {
                  gt: 40,
                  lte: 60,
                  color: risk2color(50)
              }, {
                  gt: 60,
                  lte: 80,
                  color: risk2color(70)
              }, {
                  gt: 80,
                  lte: 100,
                  color: risk2color(90)
              }
            ],
            outOfRange: {
              color: '#999'
            }
          },
          series: [
            {
              name: 'World Risk',
              type: 'line',
              show: false,
              smooth: true,
              symbol: 'none',
              data: keys.map(d => worldData![d].risk || 0),
              lineStyle: {
                color: 'grey',
                width: 3,
                opacity: 0.5
              }
            },
            {
              name: 'Region Risk',
              type: 'line',
              smooth: true,
              symbol: 'none',
              data: keys.map(d => regionData![d].risk || 0),
              lineStyle: {
                width: 3
              }
            }
          ]
        }
      }
    }
    return option;
  }

  popover(): JSX.Element {
    const isMobile: boolean = this.props.env.isMobile;
    const lang: string = this.props.env.lang;
    return (
        <div className='popover' style={{width: isMobile ? '200px' : "360px"}}>
            <div className='h1'>{lang == 'zh' ? "我们使用多个维度的数据，对地区的风险指数进行综合评估：" : "We aggregate multiple dimensions of data to conduct a comprehensive assessment of the regional risk index, including:"}</div>
            <div className='h2'>{lang == 'zh' ? "- 历史疫情数据，包括确诊病例，死亡/治愈率，预测的拐点等" : "- Historical epidemic data, including confirmed cases, death / cure rates, predicted inflection points, etc."}</div>
            <div className='h2'>{lang == 'zh' ? "- 地区人口数据 [1]" : "- Regional population data [1]"}</div>
            <div className='h2'>{lang == 'zh' ? "- 地区医疗资源 [2]" : "- Regional medical resources [2]"}</div>
            <div className='origin'>
                <div className='h3'><a href='https://data.worldbank.org/indicator/sp.pop.totl' target="_blank">{"[1]  https://data.worldbank.org/indicator/sp.pop.totl"}</a></div>
                <div className='h3'><a href='https://www.ghsindex.org/' target="_blank">{"[2]  https://www.ghsindex.org/"}</a></div>
            </div>
        </div>
    )
  } 

  render() {
    const regionInfo = this.props.regionInfo || {name_en: '', name_zh: ''}
    let fullName = this.props.env.lang === 'en' ? regionInfo.name_en : regionInfo.name_zh
    if (fullName === 'United States of America') fullName = "United States"
    else if (fullName === 'People\'s Republic of China') fullName = "China"
    fullName = fullName.replace('Republic', 'Rep.').replace('Democratic', 'Dem.')
    const ep = this.props.dayEp
    let active: number | undefined = ep ? ((ep.confirmed||0) - (ep.cured||0) - (ep.dead||0)) : undefined;
    let active_delta: number | undefined = ep ? ((ep.confirmed_delta||0) - (ep.cured_delta||0) - (ep.dead_delta||0)) : undefined;
    return (
      <div className='dashboard'>
        <div className='up'>
          <div className='left'>
            <DBBlock style={{width: `${this.props.env.isMobile ? this._leftWidth_m : this._leftWidth}px`, height: `${this._upHeight}px`}}>
              <div className='region'>{fullName}</div>
              <Popover 
                title={this.props.env.lang == 'zh' ? "风险指数" : "Risk Index"}
                placement='bottom'
                content={this.popover()}>
                <div className='risk'>
                  <div className='value' style={{color: risk2color(ep?.risk)}}>{displayNumber(ep?.risk)}</div>
                  <div className='title'>Risk Index</div>
                </div>
              </Popover>
              <div className='mode-con'>
                <MapModeSelector mapMode={this.props.mapMode} onSetMapMode={this.props.onSetMapMode}/>
              </div>
            </DBBlock>
          </div>
          { 
            !this.props.env.isMobile && (
              <div className='right'>
                <div className='rightup'>
                  <DBBlock style={{width: `${this._dataWidth}px`, height: `${this._rightupHeight}px`}}>
                    <Tooltip title={this.props.env.lang == 'zh' ? "累计确诊" : "Total Confirmed"} placement='top' >
                      <div>
                        <div className='data-delta' style={{color: 'lightsalmon'}}><i className="fas fa-plus"/><span className="agg">{displayNumber(ep?.confirmed_delta)}</span></div>
                        <div className='data' style={{color: 'red'}}><i className="fas fa-medkit"/><span className="agg">{displayNumber(ep?.confirmed)}</span></div>
                      </div>
                    </Tooltip>
                  </DBBlock>
                  <DBBlock style={{width: `${this._dataWidth}px`, height: `${this._rightupHeight}px`}}>
                    <Tooltip title={this.props.env.lang == 'zh' ? "现存确诊" : "Active"} placement='top' >
                      <div>
                        <div className='data-delta' style={{color: 'lightgoldenrodyellow'}}><i className="fas fa-plus"/><span className="agg">{displayNumber(active_delta)}</span></div>
                        <div className='data' style={{color: 'khaki'}}><i className="fas fa-diagnoses"/><span className="agg">{displayNumber(active)}</span></div>
                      </div>
                    </Tooltip>
                  </DBBlock>
                  <DBBlock style={{width: `${this._dataWidth}px`, height: `${this._rightupHeight}px`}}>
                    <Tooltip title={this.props.env.lang == 'zh' ? "治愈" : "Cured"} placement='top' >
                      <div>
                        <div className='data-delta' style={{color: 'palegreen'}}><i className="fas fa-plus"/><span className="agg">{displayNumber(ep?.cured_delta)}</span></div>
                        <div className='data' style={{color: 'lime'}}><i className="fas fa-star-of-life"/><span className="agg">{displayNumber(ep?.cured)}</span></div>
                      </div>
                    </Tooltip>
                  </DBBlock>
                  <DBBlock style={{width: `${this._dataWidth}px`, height: `${this._rightupHeight}px`}}>
                    <Tooltip title={this.props.env.lang == 'zh' ? "死亡" : "Dead"} placement='top' >
                      <div>
                        <div className='data-delta' style={{color: 'gainsboro'}}><i className="fas fa-plus"/><span className="agg">{displayNumber(ep?.dead_delta)}</span></div>
                        <div className='data' style={{color: 'darkgrey'}}><i className="fas fa-skull-crossbones"/><span className="agg">{displayNumber(ep?.dead)}</span></div>
                      </div>
                    </Tooltip>
                  </DBBlock>
                </div>
                <div className='rightdown'>
                  <DBBlock style={{width: `${this._riskWidth}px`, height: `${this._rightdownHeight}px`}}>
                    <div className='chart-con'>
                      <ReactEcharts option={this.riskOption()} style={{height: `${this._rightdownHeight-12}px`, width: '100%'}}/>
                      <div className='title'><FormattedMessage id='map.control.riskchart' /></div>
                    </div>
                  </DBBlock>
                </div>
              </div>
            )
          }
        </div>
      </div>
    )
  }
}