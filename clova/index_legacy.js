function main(params) {

	let intent = params.request.intent.name;
	let result = "NaN";
	const recommendedTypeList = ['한번 맛보면 참을 수 없는', '남녀노소 즐길 수 있는', '기가 막히고 혀가 놀라는'];
	const tutorialList = ['이전 요리 단계를 알고 싶으면', '현재 요리 단계를 알고 싶으면', '다음 요리 단계를 알고 싶으면'];
	
	let attributes = {
		"formerIntent": intent,
		"recommendation": 0,
		"recipe": "NaN",
		"step": 0
	}
	try {
		let formerAttributes = params.session.sessionAttributes;
		
		attributes.recommendation = formerAttributes.recommendation;
		attributes.recipe = formerAttributes.recipe;
		attributes.step = formerAttributes.step;
	} catch (e) {
		console.log(e);
	}
	
	if(intent == 'Clova.GuideIntent') {
		//첫 인사
		attributes.recommendation = getRecommendation(3);
		result = "안녕하세요. 모두의 요리사 요리왕입니다.\n\r만들고 싶은 음식을 말씀해 주세요.\n\r잘 모르시겠다면 요리왕이 " + recommendedTypeList[attributes.recommendation] + " 요리를 추천해 드릴께요."
	} else if(intent == 'AskRecipe') {
		//레시피 질문
		attributes.recipe = params.request.intent.slots.food.value;
		result = attributes.recipe + "를 만들어 볼까요?";
	} else if(intent == 'AskRecipeRecommendation') {
		attributes.recommendation = params.session.sessionAttributes.recommendation;
		attributes.recipe = "미역국";	//추후 음식 추천으로 개발
		result = recommendedTypeList[attributes.recommendation] + " " + attributes.recipe + "를 만들어 볼까요?";
	} else if(intent == 'Clova.YesIntent') {
		tutorial = getRecommendation(3);
		result = "요리왕이 " + attributes.recipe + " 레시피에 대해 다 알려줄테니까 걱정마세요. 먼저 원활한 요리 진행을 위해 저랑 약속 하나만 하고 갈까요?\r\n잘 들어주세요. 요리 도중 요리 이전 단계를 알고 싶으면 이전, 현재 단계를 알고 싶으면 ‘다시’, 다음 단계를 알고 싶은 ‘다음＇이라고 말해주세요."
		attributes.step = 0;
	} else if(intent == 'Clova.NoIntent') {
		attributes.recommendation = getRecommendation(3);
		result = "음.. 그럼 다른 요리를 해볼까요?\n\r만들고 싶은 음식을 말씀해 주세요.\n\r잘 모르시겠다면 요리왕이 " + recommendedTypeList[attributes.recommendation] + " 요리를 추천해 드릴께요."
	} else if(intent == 'NextStep') {
		attributes.recipe = params.session.sessionAttributes.recipe;
		if(attributes.step < 5) {
			attributes.step = attributes.step + 1;
		}
		result = getRecipeStep(attributes.recipe, attributes.step);
	} else if(intent == 'PreviousStep') {
		attributes.recipe = params.session.sessionAttributes.recipe;
		if(attributes.step > 1) {
			attributes.step = attributes.step - 1;
		}
		result = getRecipeStep(attributes.recipe, attributes.step);
	} else if(intent == 'RepeatStep') {
		attributes.recipe = params.session.sessionAttributes.recipe;
		result = getRecipeStep(attributes.recipe, attributes.step);
	} else {
		//첫 인사
		attributes.recommendation = getRecommendation(3);
		result = "안녕하세요. 모두의 요리사 요리왕입니다.\n\r만들고 싶은 음식을 말씀해 주세요.\n\r잘 모르시겠다면 요리왕이 " + recommendedTypeList[attributes.recommendation] + " 요리를 추천해 드릴께요."
	}
	
	console.log(intent);
	console.log("선택된 요리: " + attributes.recipe);
	console.log(attributes.step);

	let response = convertJSON(result);
	response.sessionAttributes = attributes;
	
  return response;
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

function getRecommendation(range) {
	return Math.floor(Math.random() * range);
}

function convertJSON(text) {
	let result = {
		"version": "0.1.0",
		"sessionAttributes": {},
		"response": {
			"outputSpeech": {
				"type": "SimpleSpeech",
				"values": {
					"type": "PlainText",
					"lang": "ko",
					"value": text
				}
			},
			"card": {},
			"directives": [],
			"shouldEndSession": false
		}
	};

	return result;
}

function convertJSONSpeech(text) {
	let result = {
		"version": "0.1.0",
		"sessionAttributes": {},
		"response": {
			"outputSpeech": {
				"type": "SimpleSpeech",
				"values": [
					{
						"type": "PlainText",
						"lang": "ko",
						"value": text
					}, 
					{
						"type": "URL",
						"lang": "" ,
						"value": "https://www.sample-videos.com/audio/mp3/crowd-cheering.mp3"
					}
				]
			},
			"card": {},
			"directives": [],
			"shouldEndSession": false
		}
	};

	return result;
}