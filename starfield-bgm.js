/*  starfield-bgm.js — 星空粒子 + 流星雨 + BGM 播放器模块
 *  用法：在任何 HTML 页面中加入以下一行即可（bgm.mp3 放在同目录）
 *  <script src="starfield-bgm.js"></script>
 *  可选配置（放在 script 标签之前）：
 *  <script>window.SF_CONFIG={stars:300,maxMeteors:10,bgmSrc:'bgm.mp3',title:'Song',artist:'Artist',volume:0.6}</script>
 */
(function(){
"use strict";
var CFG = window.SF_CONFIG || {};
var STAR_COUNT    = CFG.stars      || 300;
var MAX_METEORS   = CFG.maxMeteors || 10;
var BGM_SRC       = CFG.bgmSrc    || 'bgm.mp3';
var SONG_TITLE    = CFG.title     || 'A Promise From Distant Days';
var SONG_ARTIST   = CFG.artist    || 'Silent Owl (Sergey Eybog) \u2014 Everlasting Summer OST';
var VOLUME        = CFG.volume    || 0.6;

/* ── 1. 注入 CSS ── */
var css = [
'#sf-canvas{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none}',
'.sf-player{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;align-items:center;gap:12px;background:rgba(15,15,40,.75);border:1px solid rgba(99,102,241,.25);border-radius:14px;padding:14px 20px;backdrop-filter:blur(10px);box-shadow:0 4px 24px rgba(0,0,0,.4);max-width:340px;transition:opacity .3s}',
'.sf-player:hover{border-color:rgba(99,102,241,.5)}',
'.sf-play-btn{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .2s,box-shadow .2s}',
'.sf-play-btn:hover{transform:scale(1.12);box-shadow:0 0 20px rgba(99,102,241,.5)}',
'.sf-info{flex:1;min-width:0}',
'.sf-title{font-size:.88rem;color:#e2e8f0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.sf-artist{font-size:.75rem;color:#64748b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.sf-player audio{display:none}',
'@media(max-width:480px){.sf-player{bottom:10px;right:10px;left:10px;max-width:none;padding:10px 14px}}'
].join('\n');
var style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

/* ── 2. 注入 HTML ── */
var canvas = document.createElement('canvas');
canvas.id = 'sf-canvas';
document.body.insertBefore(canvas, document.body.firstChild);

var player = document.createElement('div');
player.className = 'sf-player';
player.innerHTML =
    '<button class="sf-play-btn" id="sfBtn">\u25B6</button>' +
    '<div class="sf-info"><div class="sf-title">' + SONG_TITLE + '</div>' +
    '<div class="sf-artist">' + SONG_ARTIST + '</div></div>' +
    '<audio id="sfAudio" src="' + BGM_SRC + '" loop preload="auto"></audio>';
document.body.appendChild(player);

/* ── 3. 星空动画 ── */
var ctx = canvas.getContext('2d');
var W, H;
function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

// 星星
var stars = [];
for(var i = 0; i < STAR_COUNT; i++){
    stars.push({
        x: Math.random()*W, y: Math.random()*H,
        r: Math.random()*1.8+0.3,
        base: Math.random()*0.6+0.3, a: 0,
        spd: Math.random()*0.008+0.003,
        ph: Math.random()*Math.PI*2,
        hue: 220 + Math.random()*40           // 淡蓝到淡紫色调
    });
}

// 流星
var meteors = [];
var particles = []; // 流星尾迹碎片

function spawnMeteor(){
    var big = Math.random() < 0.25;            // 25% 概率出现大火球
    meteors.push({
        x: Math.random()*W*0.9 + W*0.05,
        y: -20 - Math.random()*H*0.15,
        len: (big ? 140 : 70) + Math.random()*60,
        speed: (big ? 7 : 5) + Math.random()*4,
        angle: Math.PI/4 + (Math.random()-0.5)*0.4,
        a: 1, life: 0,
        maxLife: (big ? 60 : 40) + Math.random()*30,
        width: big ? 2.5 : 1.2,
        headR: big ? 3.5 : 2,
        hue: big ? 200+Math.random()*30 : 220+Math.random()*40,
        big: big
    });
}

// 初始就生成一批流星
for(var m = 0; m < MAX_METEORS; m++) spawnMeteor();

// 持续补充流星，保持场上约 MAX_METEORS 个
setInterval(function(){
    while(meteors.length < MAX_METEORS) spawnMeteor();
}, 800);

var t = 0;
function draw(){
    ctx.clearRect(0,0,W,H);
    t += 0.016;

    // 绘制星星
    for(var i=0; i<stars.length; i++){
        var s = stars[i];
        s.a = s.base + Math.sin(t*s.spd*60+s.ph)*0.3;
        if(s.a<0)s.a=0; if(s.a>1)s.a=1;
        ctx.beginPath();
        ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle = 'hsla('+s.hue+',60%,85%,'+s.a.toFixed(2)+')';
        ctx.fill();
    }

    // 绘制流星
    for(var i=meteors.length-1;i>=0;i--){
        var m=meteors[i];
        m.life++;
        var dx=Math.cos(m.angle)*m.speed, dy=Math.sin(m.angle)*m.speed;
        m.x+=dx; m.y+=dy;
        m.a = 1 - m.life/m.maxLife;
        if(m.a<=0 || m.y>H+50 || m.x>W+50 || m.x<-50){ meteors.splice(i,1); continue; }

        // 尾迹渐变
        var tx=m.x-Math.cos(m.angle)*m.len, ty=m.y-Math.sin(m.angle)*m.len;
        var g=ctx.createLinearGradient(tx,ty,m.x,m.y);
        g.addColorStop(0,'hsla('+m.hue+',60%,80%,0)');
        g.addColorStop(0.6,'hsla('+m.hue+',50%,85%,'+(m.a*0.4).toFixed(2)+')');
        g.addColorStop(1,'hsla('+m.hue+',40%,95%,'+m.a.toFixed(2)+')');
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(m.x,m.y);
        ctx.strokeStyle=g; ctx.lineWidth=m.width; ctx.stroke();

        // 流星头部发光
        var hg=ctx.createRadialGradient(m.x,m.y,0,m.x,m.y,m.headR*3);
        hg.addColorStop(0,'hsla('+m.hue+',30%,100%,'+m.a.toFixed(2)+')');
        hg.addColorStop(0.4,'hsla('+m.hue+',50%,90%,'+(m.a*0.6).toFixed(2)+')');
        hg.addColorStop(1,'hsla('+m.hue+',60%,80%,0)');
        ctx.beginPath(); ctx.arc(m.x,m.y,m.headR*3,0,Math.PI*2);
        ctx.fillStyle=hg; ctx.fill();

        ctx.beginPath(); ctx.arc(m.x,m.y,m.headR,0,Math.PI*2);
        ctx.fillStyle='hsla(0,0%,100%,'+m.a.toFixed(2)+')';
        ctx.fill();

        // 尾迹碎片粒子
        if(m.life%2===0 && m.a>0.3){
            particles.push({
                x: m.x - dx*2 + (Math.random()-0.5)*4,
                y: m.y - dy*2 + (Math.random()-0.5)*4,
                r: Math.random()*1.2+0.3,
                a: m.a*0.7,
                fade: 0.02+Math.random()*0.02,
                hue: m.hue
            });
        }
    }

    // 绘制碎片粒子
    for(var i=particles.length-1;i>=0;i--){
        var p=particles[i];
        p.a -= p.fade;
        if(p.a<=0){ particles.splice(i,1); continue; }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle='hsla('+p.hue+',50%,80%,'+p.a.toFixed(2)+')';
        ctx.fill();
    }
    // 限制粒子数量防止性能问题
    if(particles.length > 500) particles.splice(0, particles.length-500);

    requestAnimationFrame(draw);
}
draw();

window.addEventListener('resize',function(){
    for(var i=0;i<stars.length;i++){ stars[i].x=Math.random()*W; stars[i].y=Math.random()*H; }
});

/* ── 4. BGM 播放器 ── */
var audio = document.getElementById('sfAudio');
audio.volume = VOLUME;
audio.muted = true;
var pp = audio.play();
if(pp) pp.then(function(){
    document.getElementById('sfBtn').textContent = '\u275A\u275A';
}).catch(function(){});

function sfUnmute(){
    if(audio.muted){
        audio.muted = false; audio.volume = VOLUME;
        if(audio.paused) audio.play();
        document.getElementById('sfBtn').textContent = '\u275A\u275A';
    }
}
document.addEventListener('click', sfUnmute);
document.addEventListener('touchstart', sfUnmute);

document.getElementById('sfBtn').addEventListener('click', function(e){
    e.stopPropagation(); sfUnmute();
    var btn = this;
    if(!audio.paused){ audio.pause(); btn.textContent = '\u25B6'; }
    else { audio.play(); btn.textContent = '\u275A\u275A'; }
});

})();
