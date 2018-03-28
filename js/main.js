import ReactDOM from 'react-dom';
import ShareButton from '.button.jsx';
window.loadButton = function () {
  document.write('loading button');
  ReactDOM.render(
    <ShareButton />,
    document.getElementById('share_button'),
  ); 
}