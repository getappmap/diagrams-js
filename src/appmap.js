import { ComponentDiagram }  from './componentDiagram';
import FlowView from './flowView';
import Timeline from './timeline';
import EventInfo from './eventInfo';
import buildCallTree from './callTree';

const appmap = { buildCallTree, EventInfo, ComponentDiagram, FlowView, Timeline };

export default appmap;
