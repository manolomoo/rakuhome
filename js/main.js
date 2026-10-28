const hd=document.querySelector('.hd'),b=document.body;
addEventListener('scroll',()=>{const s=scrollY>60;hd.classList.toggle('solid',s);b.classList.toggle('solidside',s)});
document.querySelector('.burger').onclick=()=>{document.querySelector('.nav').classList.toggle('open');b.classList.toggle('open-x')};
document.querySelectorAll('.nav a').forEach(a=>a.onclick=()=>{document.querySelector('.nav').classList.remove('open');b.classList.remove('open-x')});
const io=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.12});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
