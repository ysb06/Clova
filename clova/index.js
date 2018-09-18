const waitingMusic = 'https://www.sample-videos.com/audio/mp3/crowd-cheering.mp3'
const uuid = require('uuid').v4;
const timeUtil = require('date-utils');
const { DOMAIN } = require('../config');

const sessionExpireTime = 600000;

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
	console.log('-------------------------------------------------------------------------------\n');
};

//-------------------- Intent 처리 --------------------//
//HTTP Request와 Clova에서 Request를 혼동하지 않도록 주의
//추후 request나 intent를 클래스화 하여 관리
function detectRequest(requestType, clovaResponse) {
	switch(requestType) {
		case 'LaunchRequest':
			clovaResponse.addSimpleSpeech('아무 말이나 해보세요.');
			console.log('LaunchRequest --> ');
			break;
		case 'EventRequest':
			let clovaEvent = clovaResponse.clovaEvent;
			console.log('Event --> ' + clovaEvent);
			clovaResponse.setDialogueEnd();
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
	
	switch(clovaResponse.intent) {
		case 'Clova.NoIntent':
			clovaResponse.addPlayDirective(waitingMusic);
			break;
		default:
			clovaResponse.addSimpleSpeech('현재 Intent ' + clovaResponse.intent);
			break;
	}
	return clovaResponse;
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