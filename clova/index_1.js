const uuid = require('uuid').v4;
require('date-utils');

//주요 설정
const waitingMusic = 'https://www.sample-videos.com/audio/mp3/crowd-cheering.mp3'   //대기 음악
const sessionExpireTime = 600000;   //만료 시간 (10분)
const recommendedTypeList = ['맛없는', '한번 맛보면 참을 수 없는', '남녀노소 즐길 수 있는', '기가 막히고 혀가 놀라는'];     //Recommendation 정의

let fullfilmentsResult = new Array();		//기억 중인 세션, 10분 후 저장된 세션은 Disable 됨

class ClovaSession {
    constructor(req) {
        //속성 정의
        this.sessionID = req.body.session.sessionId;
        this.isEndDialogue = false;

        this.raw = {};
        this.time = 0;
        this.formerIntent = 'No Value';
        this.recommendation = 0;
        this.targetRecipe = 'No Value';
        this.currentStep = 0;
        this.currentIntent = 'No Value';

        //초기화
        this.update(req);
    }

    get result() {
        let response = {
			"version": "0.1.0",
			"sessionAttributes": {
                "formerIntent": this.formerIntent,
                "recommendation": this.recommendation,
                "recipe": this.recipe,
                "step": this.currentStep
            },
			"response": {
				"card": {},
				"directives": [],
				"shouldEndSession": this.isEndDialogue
			}
        }
        
        return response;
    }

    update(req) {
        let dateNow = new Date();

        this.raw = req.body;
        this.time = dateNow.getTime();
        this.formerIntent = req.body.session.sessionAttributes.formerIntent;
        this.recommendation = req.body.session.sessionAttributes.recommendation;
        this.targetRecipe = req.body.session.sessionAttributes.recipe;
        this.currentStep = req.body.session.sessionAttributes.step;

        switch(req.body.request.type) {
            case "IntentRequest":
                this.currentIntent = req.body.request.intent.name;
                break;
            case "LaunchRequest":
                this.currentIntent = "LaunchRequest";
                break;
            case "EventRequest":
                this.currentIntent = req.body.request.event.name;
                break;
            default:
                this.currentIntent = 'Unknown Intent';
                break;
        }        
    }
}

exports.clovaFulfillment = function (req, res) {
    let A = getCurrentSession(req);
    //console.log(A.result);
    //console.log(A.result.version);
    console.log(A.result.sessionAttributes.formerIntent);
}

function getCurrentSession(req) {   
    //현재 세션이 저장되어 있는지 판단
    //저장된 세션이 현재 세션과 같은 경우 저장된 해당 세션을 리턴
    //아닌경우 새로 생성 저장 후 저장된 세션을 리턴
    //추가로 시간이 오래된 세션을 제외
    let session;
    let cDate = new Date();

    //먼저 시간이 오래된 세션 제거
    for(let i = 0; i < fullfilmentsResult.length; i++) {
        if(cDate.getTime() - fullfilmentsResult[i].time > sessionExpireTime) {
            console.log('Splice');
            fullfilmentsResult.splice(i, 1);
            session = undefined;
        }
    }

    //저장된 세션들 중 하나가 현재 세션인지 판단
    for(let i = 0; i < fullfilmentsResult.length; i++) {
        if(req.body.context.hasOwnProperty('AudioPlayer')) {
            if(fullfilmentsResult[i].sessionID == req.body.context.AudioPlayer.token) {
                session = fullfilmentsResult[i];
                session.update(req);
            }
        } else {
            if(fullfilmentsResult[i].sessionID == req.body.session.sessionId) {
                session = fullfilmentsResult[i];
                session.update(req);
            }
        }
    }

    //찾지 못하면 새로 작성 아니면 해당 세션 반환
    if(session === undefined) {
        let newSession = new ClovaSession(req);
        fullfilmentsResult.push(newSession);
        console.log('New Dialogue');
        return newSession;
    } else {
        return session;
    }
}

//-------------------테스트 코드-----------------//
let request = {body: { version: '1.0',
session:
 { new: true,
   sessionAttributes: {},
   sessionId: '7a3284c7-e964-444c-8b08-e340aa8e0c05',
   user: { userId: 'KkQUK8ZMTzSKTMhVZMDLJw' } },
context:
 { Applications: { header: '', payload: '' },
   System: { application: '', device: '', user: '' } },
request:
 { type: 'LaunchRequest',
   requestId: 'f6650aed-57ce-4515-9c80-a0c1d61eba08',
   timestamp: '2018-09-19T08:41:47Z',
   locale: 'ko-KR',
   extensionId: 'com.santaclova.moduyori',
   intent: { intent: '', name: '', slots: null },
   event: { namespace: '', name: '', payload: null } } } };



this.clovaFulfillment(request, 'A');
console.log('------------')
this.clovaFulfillment(request, 'B');