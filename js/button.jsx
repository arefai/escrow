import React from 'react';
import ReactDOM from 'react-dom';

class ShareButton extends React.Component {
  /* Feed will display posts */

  constructor(props) {
    super(props);
    this.state = { text: 'push to share' };
    this.share = this.share.bind(this);
  }

  componentDidMount() {
    
  }
  
  share() {
    let message = {
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "elements": [{
            "title":"I took Peter's 'Which Hat Are You?' Quiz",
            "image_url": "https://bot.peters-hats.com/img/hats/fez.jpg",
            "subtitle": "My result: Fez",
            "default_action":{
              "type":"web_url",
              "url": "https://bot.peters-hats.com/view_quiz_results.php?user=24601"
            },
            "buttons":[{
              "type":"web_url",
              "url":"https://bot.peters-hats.com/hatquiz.php?referer=24601",
              "title":"Take the Quiz"
            }]
          }]
        }
      }
    };

    window.MessengerExtensions.beginShareFlow(function(share_response) {
      // User dismissed without error, but did they share the message?
      if(share_response.is_sent){
        // The user actually did share. 
        // Perhaps close the window w/ requestCloseBrowser().
      }
    }, 
    function(errorCode, errorMessage) {      
    // An error occurred in the process

    },
    message,
    "broadcast");
  }
  
  render() {
    return (
      <button onclick={this.share()}> Click to demo sharing </button>
    );
  }
}



export default ShareButton;


