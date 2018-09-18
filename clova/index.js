const waitingMusic = 'https://www.sample-videos.com/audio/mp3/crowd-cheering.mp3'
const uuid = require('uuid').v4;
const timeUtil = require('date-utils');
const { DOMAIN } = require('../config');

const sessionExpireTime = 600000;

const recommendedTypeList = ['맛없는', '한번 맛보면 참을 수 없는', '남녀노소 즐길 수 있는', '기가 막히고 혀가 놀라는'];

let fullfilmentsResult = new Array();		//기억 중인 세션, 10분 후 저장된 세션은 Disable 됨

class ClovaResult {
	constructor (request, timeStamp) {
		this.sessionID = 'NaN';
		this.audioToken = 'NaN';
		this.timeID = timeStamp;
		try {
			this.sessionID = request.body.session.sessionId;
			this.audioToken = request.body.context.AudioPlayer.token;
		} catch (e) {
			console.log(e);
		}
		this.initialize(request.body);
	}
	
	initialize(params) {	
		this.params = params;
		let attributes = {
			"formerIntent": 'NaN',
			"recommendation": 0,
			"recipe": "NaN",
			"step": 0
		}
		// Attribute 초기화, Attribute가 없으면 에러로 인한 무시
		try {
			attributes.recommendation = params.session.sessionAttributes.recommendation;
			attributes.recipe = params.session.sessionAttributes.recipe;
			attributes.step = params.session.sessionAttributes.step;
		} catch (e) {
			console.log(e);
		}
		// Result 속성 정의
		this.result = {
			"version": "0.1.0",
			"sessionAttributes": attributes,
			"response": {
				"card": {},
				"directives": [],
				"shouldEndSession": false
			}
		}
		
		this.intent = 'NaN';
		this.clovaEvent = 'NaN';
		try {
			this.intent = params.request.intent.name;
		} catch (e) {
			console.log(e);
		}
		try {
			this.clovaEvent = params.request.event.name;
		} catch (e) {
			console.log(e);
		}
	}
	
	
	addSimpleSpeech(text) {
		let plainText = {
			type: 'PlainText',
			lang: 'ko',
			value: text,
		};
		
		if(this.result.response.outputSpeech === undefined) {
			this.result.response.outputSpeech = {
					"type": "SpeechList",
					"values": []
				};
		}
		
		this.result.response.outputSpeech.values.push(plainText);
	}
	
	addPlayDirective(url) {
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
		
		this.result.response.directives.push(directive);
		this.setDialogueEnd();
	}
	
	//'Pause', 'Resume', 'Stop'
	addPlayControllerDirective(text) {
		let directive = {
			header: {
				namespace: "PlaybackController",
				name: text,
				dialogRequestId: uuid(),
				messageId: uuid()
			},
			"payload": {}
		};
		
		this.result.response.directives.push(directive);
	}
	
	setDialogueEnd() {
		this.result.response.shouldEndSession = true;
	}
	
	setDialogueContinue() {
		this.result.response.shouldEndSession = false;
	}
	
	setRecommendation() {
		this.recommendation = Math.floor(Math.random() * 3) + 1;
	}
	
	get formerIntent() {
		return this.result.sessionAttributes.formerIntent;
	}
	
	get recommendation() {
		return this.result.sessionAttributes.recommendation;
	}
	
	get recipe() {
		return this.result.sessionAttributes.recipe;
	}
	
	get step() {
		return this.result.sessionAttributes.step;
	}
	
	set formerIntent(value) {
		this.result.sessionAttributes.formerIntent = value;
	}
	
	set recommendation(value) {
		this.result.sessionAttributes.recommendation = value;
	}
	
	set recipe(value) {
		this.result.sessionAttributes.recipe = value;
	}
	
	set step(value) {
		this.result.sessionAttributes.step = value;
	}
}

exports.clovaFulfillment = function (req, res) {
	//현 함수에서는 다음과 같은 기능을 정의하고 있음
	//대화 처리 준비, 대화 세션 저장 및 불러오기, 새 대화일 경우 대화 생성, 최종 Result를 Response, 수신 및 송신 로그 출력
	let cDate = new Date();
	console.log('\n--------------------- ' + cDate.toFormat('YYYY-MM-DD HH24:MI:SS') + ' (' +cDate.getTime() + ') ---------------------');
	let params = req.body;
	console.log('Request in -->\n');
	console.log(params);
	let clovaReq = 'NaN';
	
	try {
		clovaReq = params.request.type;
	} catch (e) {
		console.log(e);
	}
	
	let sessionID = 'NaN';
	let audioToken = 'NaN';
	try {
		sessionID = params.session.sessionId;
		audioToken = params.context.AudioPlayer.token;
	} catch (e) {
		console.log(e);
	}
	
	console.log('\n');
	let clovaResponse;		//현재 대화
	let newResults = new Array();
	fullfilmentsResult.forEach(result => {
		//현재 세션인지 여부 판단 및 추출, sessionID가 다르더라도 audioToken이 같으면 현재 Dialogue로 보고 세트
		if((sessionID == result.sessionID || audioToken == result.audioToken) && !(audioToken == 'NaN')) {			
			result.initialize(req.body); //현재 세션일 경우 해당 세션 리셋(재생성)
			result.sessionID = sessionID;	//세션 ID 갱신
			clovaResponse = result;
		}
		//시간이 오래된 세션을 제외
		if(cDate.getTime() - result.timeID < sessionExpireTime) {
			newResults.push(result);
		}
	});
	if(clovaResponse === undefined) {
		clovaResponse = new ClovaResult(req, cDate.getTime());
		console.log('New Dialogue');
		newResults.push(clovaResponse);
	}
	console.log('Current Dialogue--> ' + clovaResponse.sessionID + ', ' + clovaResponse.audioToken);
	fullfilmentsResult = newResults;
	console.log('Active --> ' + fullfilmentsResult.length)

	//----------------- intent 및 event 처리 -------------------//
	clovaResponse = detectRequest(clovaReq, clovaResponse);
	//----처리 완료----//

	console.log('\nResponse out -->');
	console.log(clovaResponse.result);
	/*
	console.log(result.response.outputSpeech.values);
	console.log('<-- Directives -->');
	console.log(result.response.directives);
	console.log(result.response.directives[0].payload);
	//*/
	res.json(clovaResponse.result);
	console.log('-------------------------------------------------------------------------------\n' + clovaResponse.formerIntent);
};

//-------------------- Intent 처리 --------------------//
//HTTP Request와 Clova에서 Request를 혼동하지 않도록 주의
//추후 request나 intent를 클래스화 하여 관리
function detectRequest(requestType, clovaResponse) {
	switch(requestType) {
		case 'LaunchRequest':
			clovaResponse.setRecommendation();
			clovaResponse.addSimpleSpeech('안녕하세요. 모두의 요리사 요리왕입니다.\n\r만들고 싶은 음식을 말씀해 주세요.\n\r잘 모르시겠다면 요리왕이 ' + recommendedTypeList[attributes.recommendation] + ' 요리를 추천해 드릴께요');
			console.log('LaunchRequest --> ');
			break;
		case 'EventRequest':
			let clovaEvent = clovaResponse.clovaEvent;
			console.log('Event --> ' + clovaEvent);
			clovaResponse.setDialogueEnd();
			clovaResponse = detectMusicIntent(clovaEvent, clovaResponse);
			break;
		case 'IntentRequest':
			clovaResponse = detectIntent(clovaResponse);		//인텐트 인식
			console.log('Intent --> ' + clovaResponse.intent);
			break;
		default:
			clovaResponse.addSimpleSpeech('에러가 발생했습니다.');
			console.log('Other Request --> ' + requestType);
			break;
	}
	
	return clovaResponse;
}

function detectIntent(clovaResponse) {
	let processOK = false;		//제대로 된 시나리오에 따라 Intent가 처리됬는지 여부
	
	let recipe = '';
	switch(clovaResponse.intent) {
		case 'Clova.GuideIntent':
			clovaResponse.setRecommendation();
			clovaResponse.addSimpleSpeech('안녕하세요. 모두의 요리사 요리왕입니다.\n\r만들고 싶은 음식을 말씀해 주세요.\n\r잘 모르시겠다면 요리왕이 ' + recommendedTypeList[clovaResponse.recommendation] + ' 요리를 추천해 드릴께요');
			//현 Intent를 포함하여 이전 Intent 조건이 맞을 때만 기능 수행
			break;
		case 'AskRecipe':
			recipe = clovaResponse.params.request.intent.slots.food.value;
			clovaResponse.recipe = recipe;
			clovaResponse.addSimpleSpeech(recommendedTypeList[clovaResponse.recommendation] + ' ' + recipe + '를 만들어 볼까요?');
			break;
		case 'AskRecipeRecommendation':
			//추천은 무조건 미역국으로
			recipe = '미역국';
			clovaResponse.recipe = recipe;
			clovaResponse.addSimpleSpeech(recipe + '를 만들어 볼까요?');
			break;
		case 'Clova.YesIntent':
			let recipe = clovaResponse.recipe
			clovaResponse.addSimpleSpeech("요리왕이 " + clovaResponse.recipe + " 레시피에 대해 다 알려줄테니까 걱정마세요. 먼저 원활한 요리 진행을 위해 저랑 약속 하나만 하고 갈까요?\r\n잘 들어주세요. 먼저 요리가 진행되는 동안에는 노래가 나올 거에요. 단계가 끝나면 노래를 멈추어 주세요. 그리고나서 다음 단계를 알고 싶으면 '다음', 이전 단계를 알고 싶으면 '이전', 다시 듣고 싶으면 '다시'라고 말해주세요");
			clovaResponse.step = 0;
			break;
		case 'Clova.NoIntent':
			clovaResponse.setRecommendation();
			clovaResponse.addSimpleSpeech("음.. 그럼 다른 요리를 해볼까요?\n\r만들고 싶은 음식을 말씀해 주세요.\n\r잘 모르시겠다면 요리왕이 " + recommendedTypeList[clovaResponse.recommendation] + " 요리를 추천해 드릴께요.");
			break;
		case 'NextStep':
			if(clovaResponse.step < 5) {
				clovaResponse.step = clovaResponse.step + 1;
			}
			clovaResponse.addSimpleSpeech(getRecipeStep(clovaResponse.recipe, clovaResponse.step))
			clovaResponse.addPlayDirective(waitingMusic);
			break;
		case 'PreviousStep':
			if(clovaResponse.step > 1) {
				clovaResponse.step = clovaResponse.step - 1;
			}
			clovaResponse.addSimpleSpeech(getRecipeStep(clovaResponse.recipe, clovaResponse.step))
			clovaResponse.addPlayDirective(waitingMusic);
			break;
		case 'RepeatStep':
			clovaResponse.addSimpleSpeech(getRecipeStep(clovaResponse.recipe, clovaResponse.step))
			clovaResponse.addPlayDirective(waitingMusic);
			break;
		default:
			clovaResponse.addSimpleSpeech('죄송해요. 잘 모르겠네요. 다시 말씀해 주세요');
			break;
	}
	return clovaResponse;
}

function detectMusicIntent(clovaEvent, clovaResponse) {
	switch(clovaResponse.intent) {
		case 'PlayPaused':
		case 'PlayStopped':
			clovaResponse.addSimpleSpeech('무엇을 하시겠습니까?');
			clovaResponse.addPlayControllerDirective('Stop');
			clovaResponse.setDialogueContinue();
			break;
		default:
			//응답 없음
			break;
	}
	return clovaResponse;
}
//-------------------------------------------------------------//
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
//-------------------- 사용 되지 않는 코드 --------------------//

function initializeJSON(attributes) {
	let result = {
		"version": "0.1.0",
		"sessionAttributes": attributes,
		"response": {
			"outputSpeech": {
				"type": "SpeechList",
				"values": []
			},
			"card": {},
			"directives": [],
			"shouldEndSession": false
		}
	};
	
	return result;
}

function getSpeech(text) {
	let plainText = {
        type: 'PlainText',
        lang: 'ko',
        value: text,
	}
	
	return plainText;
}

function getURL(url) {
	let urlObj = {
        type: 'URL',
        lang: '',
        value: url,
	}
	
	return urlObj;
}

function getPlayDirective(url) {
	let directive = {
		header: {
			namespace: "AudioPlayer",
			name: "Play"
		},
		payload: {
			audioItem: {
				audioItemId: uuid(),
				episodeId: 22346122,
				stream: {
					beginAtInMilliseconds: 0,
					episodeId: 22346122,
					playType: "NONE",
					token: uuid(),
					url: url,
					urlPlayable: true
				},
				titleSubText1: 'ysb',
				titleText: 'Waiting...',
				type: 'custom'
			},
			playBehavior: "REPLACE_ALL",
			source: {
				name: "모두의 요리사"
			}
		}
	}
	
	return directive;
}

//코멘트
//하나의 방법은 노래를 들려주고 정지(또는 일시정지) 이벤트 발생 시 계속 진행, 진행 사항은 글로벌로 저장
//추후 로그인도 구현하여 개인별로 동작 가능하도록 설계