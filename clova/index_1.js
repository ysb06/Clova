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
        this.simpleSpeech;
        this.playDirective;
        this.controlDirective;

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

    setSimpleSpeech(text) {		
        let output = {
            "type": "SpeechList",
            "values": []
        };

        let plainText = {
			type: 'PlainText',
			lang: 'ko',
			value: text,
        };
        
		output.values.push(plainText)
		this.simpleSpeech = output;
	}
	
	setPlayDirective(url) {
		let directive = {
			header: {
				namespace: "AudioPlayer",
				name: "Play"
			},
			payload: {
				audioItem: {
					audioItemId: '3719c0f5-f300-4dea-ab7b-67cc35272c10',
					stream: {
						beginAtInMilliseconds: 0,
						playType: "NONE",
						token: this.sessionID,
						url: url,
						urlPlayable: true
					},
					titleSubText1: 'Yori',
					titleText: 'Waiting...',
					type: 'custom'
				},
				playBehavior: "REPLACE_ALL",
				source: {
					name: "모두의 요리사"
				}
			}
		};
		
		this.playDirective = directive;
		this.isEndDialogue = true;
	}
	
	//'Pause', 'Resume', 'Stop'
	setPlayControllerDirective(text) {
		let directive = {
			header: {
				namespace: "PlaybackController",
				name: text,
				dialogRequestId: uuid(),
				messageId: uuid()
			},
			"payload": {}
		};
		
        this.playDirective = directive;
    }
    
    setRecommendation() {
		this.recommendation = Math.floor(Math.random() * 3) + 1;
	}
}

exports.clovaFulfillment = function (req, res) {
    let cDate = new Date();
    console.log('\n--------------------- ' + cDate.toFormat('YYYY-MM-DD HH24:MI:SS') + ' (' +cDate.getTime() + ') ---------------------');
    let currentSession = getCurrentSession(req);
    console.log(currentSession);

    currentSession = detectIntent(currentSession);

    console.log('\n\n');
    console.log(currentSession.result);
    res.json(currentSession.result);
    console.log('-------------------------------------------------------------------------------\n');
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
//-----------------Intent 처리-------------------//
function detectIntent(clovaSession) {
	let processOK = false;		//제대로 된 시나리오에 따라 Intent가 처리됬는지 여부

	switch(clovaSession.currentIntent) {
        case 'LaunchRequest':
		case 'Clova.GuideIntent':
			clovaSession.setRecommendation();
			clovaSession.setSimpleSpeech('안녕하세요. 모두의 요리사 요리왕입니다.\n\r만들고 싶은 음식을 말씀해 주세요.\n\r잘 모르시겠다면 요리왕이 ' + recommendedTypeList[clovaSession.recommendation] + ' 요리를 추천해 드릴께요');
			//현 Intent를 포함하여 이전 Intent 조건이 맞을 때만 기능 수행
			break;
		case 'AskRecipe':
			{
				let food = clovaSession.raw.request.intent.slots.food.value;
				clovaSession.recipe = food;
				clovaSession.setSimpleSpeech(recommendedTypeList[clovaSession.recommendation] + ' ' + food + '를 만들어 볼까요?');
				break;
			}
		case 'AskRecipeRecommendation':
			//추천은 무조건 미역국으로
			{
				let food = '미역국';
				clovaSession.recipe = food;
				clovaSession.setSimpleSpeech(food + '를 만들어 볼까요?');
				break;
			}
		case 'Clova.YesIntent':
			{
				let food = clovaSession.recipe;
				clovaSession.setSimpleSpeech("요리왕이 " + food + " 레시피에 대해 다 알려줄테니까 걱정마세요. 먼저 원활한 요리 진행을 위해 저랑 약속 하나만 하고 갈까요?\r\n잘 들어주세요. 먼저 요리가 진행되는 동안에는 노래가 나올 거에요. 단계가 끝나면 노래를 멈추어 주세요. 그리고나서 다음 단계를 알고 싶으면 '다음', 이전 단계를 알고 싶으면 '이전', 다시 듣고 싶으면 '다시'라고 말해주세요");
				clovaSession.step = 0;
				break;
			}
		case 'Clova.NoIntent':
            clovaSession.setRecommendation();
			clovaSession.setSimpleSpeech("음.. 그럼 다른 요리를 해볼까요?\n\r만들고 싶은 음식을 말씀해 주세요.\n\r잘 모르시겠다면 요리왕이 " + recommendedTypeList[clovaSession.recommendation] + " 요리를 추천해 드릴께요.");
			break;
		case 'NextStep':
			if(clovaSession.step < 5) {
				clovaSession.step = clovaSession.step + 1;
			}
			clovaSession.setSimpleSpeech(getRecipeStep(clovaSession.recipe, clovaSession.step))
			clovaSession.setPlayDirective(waitingMusic);
			break;
		case 'PreviousStep':
			if(clovaSession.step > 1) {
				clovaSession.step = clovaSession.step - 1;
			}
			clovaSession.setSimpleSpeech(getRecipeStep(clovaSession.recipe, clovaSession.step))
			clovaSession.setPlayDirective(waitingMusic);
			break;
		case 'RepeatStep':
            clovaSession.setSimpleSpeech(getRecipeStep(clovaSession.recipe, clovaSession.step))
            clovaSession.setPlayDirective(waitingMusic);
            break;
        case 'PlayPaused':
        case 'PlayStopped':
            clovaSession.setSimpleSpeech('무엇을 하시겠습니까?');
            clovaSession.setPlayControllerDirective('Stop');
            clovaSession.setDialogueContinue();
            break;
		default:
            clovaSession.setSimpleSpeech('죄송해요. 잘 모르겠네요. 다시 말씀해 주세요');
			break;
	}
	return clovaSession;
}

function getRecipeStep(recipe, step) {
	//추후 데이터베이스에서 데이터를 받는 것으로 수정
	console.log("현재 요리: " + recipe + "? " + (recipe == "미역국") + ", " +step);
	let content = "";
	switch(step) {
		case 1:
			if(recipe == "참치김치찌개") {
				content = "다음의 재료를 준비해 주세요. 참치(통조림) 1통, 신 김치 200g, 양파 ½개, 들기름 1작은술, 마늘(다진 마늘) 1큰술, 맛술 1큰술, 고춧가루(고운 고춧가루) 1큰술, 다시마(우린 물) 4컵, 간장(약간), 후춧가루(약간)"
			} else if(recipe == "미역국") {
				content = "다음의 재료를 준비해 주세요. 미역(마른것) 5줌(20g), 쇠고기(양지머리) 120g, 물 8컵(1,600ml), 재래간장 1과 1/2큰술(22ml), 마늘(다진 마늘) 1큰술(10g), 소금 작은술(3g), 참기름 작은술(5ml)"
			}
			break;
		case 2:
			if(recipe == "참치김치찌개") {
				content = "신 김치는 양념을 털고 4㎝ 길이로 썬다. 참치는 체에 밭쳐 참치 기름과 건더기를 따로 분리한다. 참치 기름이 찌개에 들어가면 자칫 국물 맛이 기름지고 맛이 탁할 수가 있으므로 꼭 기름과 건더기를 분리해야 한다. 건더기는 통조림에서 꺼내 덩어리진 것 그대로 넣어야 참치살이 부서지지 않아 찌개가 깔끔하다."
				
			} else if(recipe == "미역국") {
				content = "마른 미역은 찬물에 담가 10분간 불린다. 찬물에 바락바락 씻어 거품이 나오지 않을 때까지 헹군다."
			}
			break;
		case 3:
			if(recipe == "참치김치찌개") {
				content = "양파는 굵게 채 썰어 냄비에 김치와 함께 담고 들기름을 약간 두른 후 다진 마늘, 맛술을 넣어 달달 볶는다. 양파를 넉넉하게 넣으면 따로 김치찌개에 설탕을 넣을 필요가 없이 단맛이 나고 김치의 묵은 냄새를 없애준다."
			} else if(recipe == "미역국") {
				content = "물기를 꼭 짠 후 적당한 크기로 자른 후 재래간장 1/2큰술을 넣고 조물조물 무친다."
			}
			break;
		case 4:
			if(recipe == "참치김치찌개") {
				content = "김치와 양파가 어우러져 볶아지고 뽀얀 국물이 맛깔스럽게 우러나면 다시마 우린 물을 붓고 고춧가루를 넣어서 함께 끓인다. 김치만으로는 김치찌개의 고운 빨간 색을 나게 할 수 없으니 고춧가루에 다시마 우린 물을 붓고 나서 멍울 없이 푸는 것이 좋다."
			} else if(recipe == "미역국") {
				content = "쇠고기는 한입 크기로 썬 후 달군 냄비에 참기름을 두르고 쇠고기, 마늘을 넣어 볶다가 쇠고기가 거의 익으면 미역을 넣고 볶는다."
			}
			break;
		case 5:
			if(recipe == "참치김치찌개") {
				content = "김치찌개가 국물과 함께 부드럽게 익어 끓으면 참치를 넣어 한소끔 끓여서 간장과 후춧가루로 간을 맞춰 상에 낸다."
			} else if(recipe == "미역국") {
				content = "03에 물을 넣고 한소끔 끓인다. 재래간장과 소금으로 간하고 더 끓인다. (물 대신 쌀뜨물을 넣으면 더욱 구수하고 맛있는 미역국을 만들 수 있다.)"
			}
			break;
		default:
			break
	}
	return content
}



//-------------------테스트 코드-----------------//
/*
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
this.clovaFulfillment(request, 'B');
//*/