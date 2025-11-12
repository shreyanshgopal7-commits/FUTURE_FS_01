// Basic interactivity and EmailJS contact handling
document.getElementById('year').textContent = new Date().getFullYear();

(function(){
  // Initialize EmailJS with provided public key
  if(window.emailjs){
    emailjs.init('zvFytbEupIoNqokic');
  }
})();

const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');

form.addEventListener('submit', function(e){
  e.preventDefault();
  statusEl.style.color = '#333';
  statusEl.textContent = 'Sending message...';

  // Send using EmailJS - service and template IDs provided
  emailjs.sendForm('service_ikkzje8', 'template_44inbhh', this)
    .then(function(){
      statusEl.style.color = 'green';
      statusEl.textContent = 'Message sent successfully! ✅';
      form.reset();
    }, function(error){
      statusEl.style.color = 'red';
      statusEl.textContent = 'Failed to send message. Please try again later.';
      console.error('EmailJS error:', error);
    });
});
