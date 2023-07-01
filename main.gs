function doPost(e) {
  const token = PropertiesService.getScriptProperties().getProperty("LINEToken");
  let eventData = JSON.parse(e.postData.contents).events[0];
  let replyToken = eventData.replyToken;
  let receivedMessage = eventData.message.text;

  if (receivedMessage == "!ID") {
    reply([{
        'type': 'text',
        'text': eventData.source.type + "\n" + eventData.source.groupId + "\n" + eventData.source.userId,
      }]);
  }
  if (eventData.source.type == "user" && receivedMessage.startsWith("/")) {
    const sheets = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("StudentListSpreadSheetID"));
    let studentID = receivedMessage.slice(1);
    let mainSheet = sheets.getSheetByName("main");
    if (mainSheet.getRange(2,1,mainSheet.getLastRow(),1).createTextFinder(studentID).findAll().length == 1) {
      try{
        let sheet = sheets.getSheetByName("LINE連携");
        if (sheet.getRange(2,1,sheet.getLastRow(),1).createTextFinder(studentID).findAll().length == 0){
          let startRow = sheet.getLastRow()+1;
          let range = sheet.getRange(startRow, 1, 1, 2);
          range.setValues([[String(studentID),eventData.source.userId]]);
          reply([{
              'type': 'text',
              'text': "登録が完了しました。",
            }]);
        } else {
          reply([{
            'type': 'text',
            'text': "既に登録されています。"
          },{
              "type": "template",
              "altText": "This is a buttons button to report issue",
              "template": {
                "type": "buttons",
                "text": "登録したことがないのにも関わらず登録されたことになっている場合は、下のボタンを押してください。",
              "actions": [{
                "type": "message",
                "label": "問題を報告",
                "text": "!report"
              }]
              }
          }]);
        }
      } catch{
        reply([{
            'type': 'text',
            'text': "エラーが発生しました。もう一度お試しください。"
          }]);
      }
    } else {
      reply([{
          'type': 'text',
          'text': "学籍番号が正しくありません。もう一度お試しください。"
        }]);
    }
  }
  if (receivedMessage == "!report"){
    reply([{
      'type': 'text',
      'text': "報告を受け付けました。スタッフが追って連絡しますのでお待ちください。"
    }]);
  }
  function reply(content){
    const options = {
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      'method': 'post',
      'payload': JSON.stringify({
        replyToken: replyToken,
        messages: content
      })
    }
    UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", options);
  }
  return;
}

function getDisplayName(id){
  const token = PropertiesService.getScriptProperties().getProperty("LINEToken");
  const options = {
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    'method': 'get'
  }
  const url = "https://api.line.me/v2/bot/profile/"+id;
  let response = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
  return response.displayName;
}
