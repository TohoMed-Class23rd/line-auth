function doPost(e) {
  const token = PropertiesService.getScriptProperties().getProperty("LINEToken");
  let eventData = JSON.parse(e.postData.contents).events[0];
  let replyToken = eventData.replyToken;
  let receivedMessage = eventData.message.text;

  if (eventData.source.type == "user") {
    const webhookUrl = PropertiesService.getScriptProperties().getProperty("SlackWebhookURL");
    const options =
    {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify({
        "username": getDisplayName(eventData.source.userId),
        "text": receivedMessage
      })
    };
    UrlFetchApp.fetch(webhookUrl, options);
  }
  if (receivedMessage == "!ID") {
    reply([{
      'type': 'text',
      'text': eventData.source.type + "\n" + eventData.source.groupId + "\n" + eventData.source.userId,
    }]);
  }
  if (eventData.source.type == "user" && receivedMessage.startsWith("/")) {
    const sheets = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("StudentListSpreadSheetID"));
    let studentID = receivedMessage.slice(1);
    let mainSheet = sheets.getSheetByName("2024-M2");
    // 学籍番号チェック
    let lookUp = mainSheet.getRange(2, 1, mainSheet.getLastRow(), 1).createTextFinder(studentID).findAll();
    switch (lookUp.length) {
      case 0:
        reply([{
          'type': 'text',
          'text': "学籍番号が正しくありません。確認の上、もう一度お試しください。"
        }, {
          'type': 'text',
          'text': "学籍番号を5桁の半角数字で正しく入力してもこのメッセージが表示される場合は、クラス委員にお問い合わせください"
        }]);
        break
      case 1:
      let lineID = mainSheet.getRange(lookUp[0].getRow(), 5);
        try {
          if (lineID.getValue() == "") {
            lineID.setValue(eventData.source.userId);
            reply([{
              'type': 'text',
              'text': "登録が完了しました。",
            }]);
          } else {
            reply([{
              'type': 'text',
              'text': "既に登録されています。"
            }, {
              'type': 'text',
              'text': "登録したことがないのにもかかわらず登録されたことになっている場合は、クラス委員にお問い合わせください"
            }]);
          }
        } catch {
          reply([{
            'type': 'text',
            'text': "エラーが発生しました。もう一度お試しください。"
          }]);
        }
        break
    }
  }
  function reply(content) {
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

function getDisplayName(id) {
  const token = PropertiesService.getScriptProperties().getProperty("LINEToken");
  const options = {
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    'method': 'get'
  }
  const url = "https://api.line.me/v2/bot/profile/" + id;
  let response = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
  return response.displayName;
}
