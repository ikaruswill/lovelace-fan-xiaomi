const LitElement = Object.getPrototypeOf(
    customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const includeDomains = ["fan"];

class FanXiaomi extends HTMLElement {
    
    static getConfigElement() {
        return document.createElement("content-card-editor");
    }
    
    static getStubConfig() {
        return { entity: "fan.fan", name: "Xiaomi Fan", platform: "xiaomi_miio_airpurifier", disable_animation: false, 
            disable_immediate_UI: true }
    }
    
    supportedAttributes = {
        angle: true, childLock: true, timer: true, rotationAngle: true, speedLevels: 4, natural_speed: true, 
            natural_speed_reporting: true, supported_angles: [30, 60, 90, 120], sleep_mode: false
    }

    set hass(hass) {
        const entityId = this.config.entity;
        const style = this.config.style || '';
        const myname = this.config.name;
        const state = hass.states[entityId];
        const ui = this.getUI();
        const platform = this.config.platform || 'xiaomi_miio_fan';
        const disable_immediate_UI = this.config.disable_immediate_UI;
        const use_standard_speeds = this.config.use_standard_speeds || false;
        const force_sleep_mode_support = this.config.force_sleep_mode_support || false;
        

        if (!this.card){
            const card = document.createElement('ha-card');
            card.className = 'fan-xiaomi'
            card.appendChild(ui)

            // Check if fan is disconnected
            if(state === undefined || state.state === 'unavailable'){
                card.classList.add('offline');
                this.card = card;
                this.appendChild(card);
                ui.querySelector('.var-title').textContent = (this.config.name || '') + ' (Disconnected)';
                return;
            }
        }
        
        if (state.state === 'unavailable'){
            ui.querySelector('.var-title').textContent = (this.config.name || '') + ' (Disconnected)';
            return;
        }
        
        const attrs = state.attributes;

        if (attrs['model'] === 'dmaker.fan.1c'){
            this.supportedAttributes.angle = false;
            this.supportedAttributes.childLock = false;
            this.supportedAttributes.rotationAngle = false;
            this.supportedAttributes.speedLevels = 3;
            this.supportedAttributes.natural_speed = false;
            this.supportedAttributes.natural_speed_reporting = false;
        }

        if (['dmaker.fan.p15', 'dmaker.fan.p11', 'dmaker.fan.p10', 'dmaker.fan.p5'].includes(attrs['model'])){
            this.supportedAttributes.natural_speed_reporting = false;
            this.supportedAttributes.supported_angles = [30, 60, 90, 120, 140];
        }
        if (['dmaker.fan.p9'].includes(attrs['model'])){
            this.supportedAttributes.natural_speed_reporting = false;
            this.supportedAttributes.supported_angles = [30, 60, 90, 120, 150];
        }
        if (['leshow.fan.ss4'].includes(attrs['model'])){
            this.supportedAttributes.natural_speed = false;
            this.supportedAttributes.natural_speed_reporting = false;
            this.supportedAttributes.rotationAngle = false;
            this.supportedAttributes.childLock = false;
            this.supportedAttributes.sleep_mode = true;
        }

        //trick to support of 'any' fan
        if (use_standard_speeds) {
            this.supportedAttributes.speedList = ['low', 'medium', 'high']
        }
        if (force_sleep_mode_support) {
            this.supportedAttributes.sleep_mode = true;
        }

        if (!this.card) {
            const card = document.createElement('ha-card');
            card.className = 'fan-xiaomi'

            // Create UI
            card.appendChild(ui)

            // Angle adjustment event bindings
            ui.querySelector('.left').onmouseover = () => {
                ui.querySelector('.left').classList.replace('hidden','show')
            }
            ui.querySelector('.left').onmouseout = () => {
                ui.querySelector('.left').classList.replace('show','hidden')
            }
            ui.querySelector('.left').onclick = () => {
                if (ui.querySelector('.fanbox').classList.contains('active')) {
                    this.log('Rotate left 5 degrees')
                    hass.callService('fan', 'set_direction', {
                        entity_id: entityId,
                        direction: "left"
                    });
                }
            }
            ui.querySelector('.right').onmouseover = () => {
                ui.querySelector('.right').classList.replace('hidden','show')
            }
            ui.querySelector('.right').onmouseout = () => {
                ui.querySelector('.right').classList.replace('show','hidden')
            }
            ui.querySelector('.right').onclick = () => {
                if (ui.querySelector('.fanbox').classList.contains('active')) {
                    this.log('Rotate right 5 degrees')
                    hass.callService('fan', 'set_direction', {
                        entity_id: entityId,
                        direction: "right"
                    });
                }
            }

            // Power toggle event bindings
            ui.querySelector('.c1').onclick = () => {
                this.log('Toggle')
                hass.callService('fan', 'toggle', {
                    entity_id: entityId
                });
            }

            // Fan speed toggle event bindings
            ui.querySelector('.var-speed').onclick = () => {
                this.log('Speed Level')
                if (ui.querySelector('.fanbox').classList.contains('active')) {
                    let blades = ui.querySelector('.fanbox .blades')
                    let u = ui.querySelector('.var-speed')
                    let iconSpan = u.querySelector('.icon-waper')
                    let icon = u.querySelector('.icon-waper > ha-icon').getAttribute('icon')
                    let newSpeedLevel
                    let newSpeed

                    let maskSpeedLevel = /mdi:numeric-(\d)-box-outline/g
                    let speedLevelMatch = maskSpeedLevel.exec(icon)
                    let speedLevel = parseInt(speedLevelMatch ? speedLevelMatch[1] : 1)
                    if (use_standard_speeds) {
                        newSpeedLevel = this.supportedAttributes.speedList[(speedLevel < 
                            this.supportedAttributes.speedList.length ? speedLevel: 0)]
                        newSpeed = newSpeedLevel
                    } else {
                        newSpeedLevel = (speedLevel < this.supportedAttributes.speedLevels ? speedLevel+1: 1)
                        newSpeed = `Level ${newSpeedLevel}`
                    }
                    

                    if (!disable_immediate_UI) {
                        iconSpan.innerHTML = `<ha-icon icon="mdi:numeric-${newSpeedLevel}-box-outline"></ha-icon>`
                        blades.className = `blades level${newSpeedLevel}`
                    }
                    this.log(`Set speed to: ${newSpeed}`)
                    hass.callService('fan', 'set_speed', {
                        entity_id: entityId,
                        speed: newSpeed
                    });
                }
            }

            // Fan angle toggle event bindings
            ui.querySelector('.button-angle').onclick = () => {
                this.log('Oscillation Angle')
                if (ui.querySelector('.fanbox').classList.contains('active')) {
                    let b = ui.querySelector('.button-angle')
                    if (!b.classList.contains('loading')) {
                        let u = ui.querySelector('.var-angle')
                        let oldAngleText = u.innerHTML
                        let newAngle
                        let curAngleIndex = this.supportedAttributes.supported_angles.indexOf(parseInt(oldAngleText,10))
                        if (curAngleIndex >= 0 && curAngleIndex < this.supportedAttributes.supported_angles.length-1) {
                            newAngle = this.supportedAttributes.supported_angles[curAngleIndex+1]
                        } else {
                            newAngle = this.supportedAttributes.supported_angles[0]
                        }
                        if (!disable_immediate_UI) {
                            u.innerHTML = newAngle
                        }
                        b.classList.add('loading')

                        this.log(`Set angle to: ${newAngle}`)
                        hass.callService(platform, 'fan_set_oscillation_angle', {
                            entity_id: entityId,
                            angle: newAngle
                        });
                    }
                }
            }

            // Timer toggle event bindings
            ui.querySelector('.button-timer').onclick = () => {
                this.log('Timer')
                if (ui.querySelector('.fanbox').classList.contains('active')) {
                    let b = ui.querySelector('.button-timer')
                    if (!b.classList.contains('loading')) {
                        let u = ui.querySelector('.var-timer')

                        let currTimer
                        let hoursRegex = /(\d)h/g
                        let minsRegex = /(\d{1,2})m/g
                        let hoursMatch = hoursRegex.exec(u.textContent)
                        let minsMatch = minsRegex.exec(u.textContent)
                        let currHours = parseInt(hoursMatch ? hoursMatch[1] : '0')
                        let currMins = parseInt(minsMatch ? minsMatch[1] : '0')
                        currTimer = currHours * 60 + currMins

                        let newTimer
                        if (currTimer < 59) {
                            newTimer = 60
                        } else if (currTimer < 119) {
                            newTimer = 120
                        } else if (currTimer < 179) {
                            newTimer = 180
                        } else if (currTimer < 239) {
                            newTimer = 240
                        } else if (currTimer < 299) {
                            newTimer = 300
                        } else if (currTimer < 359) {
                            newTimer = 360
                        } else if (currTimer < 419) {
                            newTimer = 420
                        } else if (currTimer < 479) {
                            newTimer = 480
                        } else if (currTimer = 480) {
                            newTimer = 0
                        } else {
                            this.error(`Error setting timer. u.textContent = ${u.textContent}; currTimer = ${currTimer}`)
                            newTimer = 60
                            this.error(`Defaulting to ${newTimer}`)
                        }

                        // Update timer display
                        let hours = Math.floor(newTimer / 60)
                        let mins = Math.floor(newTimer % 60)
                        let timer_display
                        if(hours) {
                            if(mins) {
                                timer_display = `${hours}h ${mins}m`
                            } else {
                                timer_display = `${hours}h`
                            }
                        } else {
                            timer_display = `${mins}m`
                        }
                        if (!disable_immediate_UI) {
                            u.textContent = timer_display
                        }
                        b.classList.add('loading')

                        this.log(`Set timer to: ${newTimer}`)
                        hass.callService(platform, 'fan_set_delay_off', {
                            entity_id: entityId,
                            delay_off_countdown: newTimer
                        });
                    }
                }
            }
            

            // Child lock event bindings
            ui.querySelector('.button-childlock').onclick = () => {
                this.log('Child lock')
                if (ui.querySelector('.fanbox').classList.contains('active')) {
                    let b = ui.querySelector('.button-childlock')
                    if (!b.classList.contains('loading')) {
                        let u = ui.querySelector('.var-childlock')
                        let oldChildLockState = u.innerHTML
                        if (oldChildLockState === 'On') {
                            this.log(`Set child lock to: Off`)
                            hass.callService(platform, 'fan_set_child_lock_off')
                            if (!disable_immediate_UI) {
                                u.innerHTML = 'Off'
                            }
                        } else if (oldChildLockState === 'Off') {
                            this.log(`Set child lock to: On`)
                            hass.callService(platform, 'fan_set_child_lock_on')
                            if (!disable_immediate_UI) {
                                u.innerHTML = 'On'
                            }
                        } else {
                            this.error(`Error setting child lock. oldChildLockState = ${oldChildLockState}`)
                            this.error(`Defaulting to Off`)
                            hass.callService(platform, 'fan_set_child_lock_off')
                            u.innerHTML = 'Off'
                        }
                        b.classList.add('loading')
                    }
                }
            }

            // Natural mode event bindings
            ui.querySelector('.var-natural').onclick = () => {
                this.log('Natural')
                if (ui.querySelector('.fanbox').classList.contains('active')) {
                    let u = ui.querySelector('.var-natural')
                    if (u.classList.contains('active') === false) {
                        this.log(`Set natural mode to: On`)
                        if (!disable_immediate_UI) {
                            u.classList.add('active')
                        }
                        hass.callService(platform, 'fan_set_natural_mode_on', {
                            entity_id: entityId
                        });
                    } else {
                        this.log(`Set natural mode to: Off`)
                        if (!disable_immediate_UI) {
                            u.classList.remove('active')
                        }
                        hass.callService(platform, 'fan_set_natural_mode_off', {
                            entity_id: entityId
                        });
                    }
                }
            }

            // Sleep mode event bindings
            ui.querySelector('.var-sleep').onclick = () => {
                this.log('Sleep')
                if (ui.querySelector('.fanbox').classList.contains('active')) {
                    let u = ui.querySelector('.var-sleep')
                    if (u.classList.contains('active') === false) {
                        this.log(`Set sleep mode to: On`)
                        if (!disable_immediate_UI) {
                            u.classList.add('active')
                        }
                        hass.callService('fan', 'set_percentage', {
                            entity_id: entityId,
                            percentage: 1
                        });
                    } else {
                        this.log(`Set sleep mode to: Off`)
                        if (!disable_immediate_UI) {
                            u.classList.remove('active')
                        }
                        hass.callService('fan', 'set_speed', {
                            entity_id: entityId,
                            speed: 'low'
                        });
                    }
                }
            }

            // Oscillation toggle event bindings
            ui.querySelector('.var-oscillating').onclick = () => {
                this.log('Oscillate')
                if (ui.querySelector('.fanbox').classList.contains('active')) {
                    let u = ui.querySelector('.var-oscillating')
                    if (u.classList.contains('active') === false) {
                        this.log(`Set oscillation to: On`)
                        if (!disable_immediate_UI) {
                            u.classList.add('active')
                        }
                        hass.callService('fan', 'oscillate', {
                            entity_id: entityId,
                            oscillating: true
                        });
                    } else {
                        this.log(`Set oscillation to: Off`)
                        if (!disable_immediate_UI) {
                            u.classList.remove('active')
                        }
                        hass.callService('fan', 'oscillate', {
                            entity_id: entityId,
                            oscillating: false
                        });
                    }
                }
            }
            ui.querySelector('.var-title').onclick = () => {
                this.log('Dialog box')
                card.querySelector('.dialog').style.display = 'block'
            }
            this.card = card;
            this.appendChild(card);
        }

        // Set and update UI parameters
        this.setUI(this.card.querySelector('.fan-xiaomi-panel'), {
            title: myname || attrs['friendly_name'],
            natural_speed: attrs['natural_speed'],
            direct_speed: attrs['direct_speed'],
            raw_speed: attrs['raw_speed'],
            state: state.state,
            child_lock: attrs['child_lock'],
            oscillating: attrs['oscillating'],
            led_brightness: attrs['led_brightness'],
            delay_off_countdown: attrs['delay_off_countdown'],
            angle: attrs['angle'],
            speed: attrs['speed'],
            mode: attrs['mode'],
            model: attrs['model'],
        })
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error('You must specify an entity');
        }
        this.config = config;
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return 1;
    }

    /*********************************** UI settings ************************************/
    getUI() {

        let csss='';
        for(var i=1;i<73;i++){
            csss+='.ang'+i+` {
                transform: rotate(`+(i-1)*5+`deg);
            }`
        }
        let fans='';
        for(var i=1;i<73;i++){
            fans+=`<div class="fan ang`+i+`"></div>`
        }
        let fan1s='';
        for(var i=1;i<73;i+=2){
            fan1s+=`<div class="fan1 ang`+i+`"></div>`
        }
        let fanbox = document.createElement('div')
        fanbox.className = 'fan-xiaomi-panel'
        fanbox.innerHTML = `
<style>
.fan-xiaomi{position:relative;overflow:hidden;width:100%;height:335px}
.offline{opacity:0.3}
.loading{opacity:0.6}
.icon{overflow:hidden;width:2em;height:2em;vertical-align:-.15em;fill:gray}
.fan-xiaomi-panel{position:absolute;top:0;width:100%;text-align:center}
p{margin:0;padding:0}
.title{margin-top:20px;height:35px;cursor:pointer}
.title p{margin:0;padding:0;font-weight:700;font-size:18px}
.title span{font-size:9pt}
.attr-row{display:flex}
.attr-row .attr{width:100%;padding-bottom:2px}
.attr-row .attr-title{font-size:9pt}
.attr-row .attr-value{font-size:14px}
.attr-row .attr:nth-child(2){border-right:1px solid #01be9e;border-left:1px solid #01be9e}
.op-row{display:flex;padding:10px;border-top:3px solid #717376!important}
.op-row .op{width:100%}
.op-row .op button{outline:0;border:none;background:0 0;cursor:pointer}
.op-row .op .icon-waper{display:block;margin:0 auto 5px;width:30px;height:30px}
.op-row .op.active button{color:#01be9e!important;text-shadow:0 0 10px #01be9e}
`+csss+`
.fanbox{position:relative;margin:10px auto;width:150px;height:150px;border-radius:50%;background:#80808061}
.fanbox.active.oscillation{animation:oscillate 8s infinite linear}
.blades div{position:absolute;margin:15% 0 0 15%;width:35%;height:35%;border-radius:100% 50% 0;background:#989898;transform-origin:100% 100%}
.blades{width:100%;height:100%}
.fanbox.active .blades.level1{transform-origin:50% 50%;animation:blades 9s infinite linear;transform-box:fill-box!important}
.fanbox.active .blades.level2{transform-origin:50% 50%;animation:blades 7s infinite linear;transform-box:fill-box!important}
.fanbox.active .blades.level3{transform-origin:50% 50%;animation:blades 5s infinite linear;transform-box:fill-box!important}
.fanbox.active .blades.level4{transform-origin:50% 50%;animation:blades 3s infinite linear;transform-box:fill-box!important}
.fan{top:0;transform-origin:0 250%}
.fan,.fan1{position:absolute;left:0;margin-left:50%;width:1%;height:20%;background:#fff}
.fan1{top:20%;transform-origin:0 150%}
.c1{top:20%;left:20%;width:60%;height:60%;border:2px solid #fff;border-radius:50%;cursor:pointer;baskground:#ffffff00}
.c1,.c2{position:absolute;box-sizing:border-box}
.c2{top:0;left:0;width:100%;height:100%;border:10px solid #f7f7f7;border-radius:50%}
.c3{position:absolute;top:40%;left:40%;box-sizing:border-box;width:20%;height:20%;border-radius:50%;background:#fff;color:#ddd}
.c3.active{border:2px solid #8dd5c3}
.c3 span ha-icon{width:100%;height:100%}
.chevron{position:absolute;top:0;height:100%;opacity:0}
.show{opacity:1}
.hidden{opacity:0}
.chevron.left{left:-30px;cursor:pointer}
.chevron.right{right:-30px;cursor:pointer}
.chevron span ha-icon{width:30px;height:100%}
.chevron span ha-icon{width:30px;height:100%;display:flex;align-items:center;justify-content:center}
.button-angle,.button-childlock,.button-timer {cursor:pointer}

@keyframes blades{0%{transform:translate(0,0) rotate(0)}
to{transform:translate(0,0) rotate(3600deg)}
}
@keyframes oscillate{0%{transform:perspective(10em) rotateY(0)}
20%{transform:perspective(10em) rotateY(40deg)}
40%{transform:perspective(10em) rotateY(0)}
60%{transform:perspective(10em) rotateY(-40deg)}
80%{transform:perspective(10em) rotateY(0)}
to{transform:perspective(10em) rotateY(40deg)}
}


</style>
<div class="title">
<p class="var-title">Playground</p>
</div>
<div class="fanbox">
<div class="blades">
<div class="b1 ang1"></div>
<div class="b2 ang25"></div>
<div class="b3 ang49"></div>
</div>
`+fans+fan1s+`
<div class="c2"></div>
<div class="c3">
<span class="icon-waper">
<ha-icon icon="mdi:power"></ha-icon>
</span>
</div>
<div class="c1"></div>
<div class="chevron left hidden">
<span class="icon-waper">
<ha-icon icon="mdi:chevron-left"></ha-icon>
</div>
<div class="chevron right hidden">
<span class="icon-waper">
<ha-icon icon="mdi:chevron-right"></ha-icon>
</div>
</span>
</div>
</div>
<div class="attr-row childlock-container">
<div class="attr button-childlock">
<p class="attr-title">Child Lock</p>
<p class="attr-value var-childlock">Off</p>
</div>
<div class="attr button-angle">
<p class="attr-title">Angle(&deg;)</p>
<p class="attr-value var-angle">120</p>
</div>
<div class="attr button-timer">
<p class="attr-title">Timer</p>
<p class="attr-value var-timer">Off</p>
</div>
</div>
<div class="op-row">
<div class="op var-speed">
<button>
<span class="icon-waper">
<ha-icon icon="mdi:numeric-0-box-outline"></ha-icon>
</span>
Speed
</button>
</div>
<div class="op var-oscillating">
<button>
<span class="icon-waper">
<ha-icon icon="mdi:debug-step-over"></ha-icon>
</span>
Oscillate
</button>
</div>
<div class="op var-natural">
<button>
<span class="icon-waper">
<ha-icon icon="mdi:leaf"></ha-icon>
</span>
Natural
</button>
</div>
<div class="op var-sleep">
<button>
<span class="icon-waper">
<ha-icon icon="mdi:power-sleep"></ha-icon>
</span>
Sleep
</button>
</div>
</div>
`
        return fanbox
    }

    // Define UI Parameters

    setUI(fanboxa, {title, natural_speed, direct_speed, raw_speed, state,
        child_lock, oscillating, led_brightness, delay_off_countdown, angle,
        speed, mode, model
    }) {
        fanboxa.querySelector('.var-title').textContent = title

        // Child Lock
        if (child_lock) {
            fanboxa.querySelector('.var-childlock').textContent = 'On'
        } else {
            fanboxa.querySelector('.var-childlock').textContent = 'Off'
        }
        fanboxa.querySelector('.button-childlock').classList.remove('loading')

        if (!this.supportedAttributes.childLock) {
            fanboxa.querySelector('.childlock-container').style.display = 'none'
        }

        // Angle
        if (this.supportedAttributes.angle){
            fanboxa.querySelector('.var-angle').textContent = angle
            fanboxa.querySelector('.button-angle').classList.remove('loading')
        } else {
            fanboxa.querySelector('.button-angle').style.display = 'none'
        }

        // Timer
        let timer_display = 'Off'
        if(delay_off_countdown) {
            let total_mins = delay_off_countdown
            
            if (['dmaker.fan.p15', 'dmaker.fan.p11', 'dmaker.fan.p10', 'dmaker.fan.p9', 'dmaker.fan.p5']
                .indexOf(model) === -1) {
                total_mins = total_mins / 60
            }

            let hours = Math.floor(total_mins / 60)
            let mins = Math.floor(total_mins % 60)
            if(hours) {
                if(mins) {
                    timer_display = `${hours}h ${mins}m`
                } else {
                    timer_display = `${hours}h`
                }
            } else {
                timer_display = `${mins}m`
            }
        }
        fanboxa.querySelector('.var-timer').textContent = timer_display
        fanboxa.querySelector('.button-timer').classList.remove('loading')

        // LED
        let activeElement = fanboxa.querySelector('.c3')
        if (led_brightness < 2) {
            if (activeElement.classList.contains('active') === false) {
                activeElement.classList.add('active')
            }
        } else {
            activeElement.classList.remove('active')
        }

        // Power
        activeElement = fanboxa.querySelector('.fanbox')
        if (state === 'on') {
            if (activeElement.classList.contains('active') === false) {
                activeElement.classList.add('active')
            }
        } else {
            activeElement.classList.remove('active')
        }

        // Speed Level
        activeElement = fanboxa.querySelector('.var-speed')
        let iconSpan = activeElement.querySelector('.icon-waper')
        if (state === 'on') {
            if (activeElement.classList.contains('active') === false) {
                activeElement.classList.add('active')
            }
        } else {
            activeElement.classList.remove('active')
        }
        //let raw_speed_int = Number(raw_speed)
        let speedRegexpMatch
        let speedLevel
        let raw_speed_int = Number(raw_speed)
        if (!this.config.use_standard_speeds) {
            let speedRegexp = /Level (\d)/g
            speedRegexpMatch = speedRegexp.exec(speed)
            if (speedRegexpMatch && speedRegexpMatch.length > 0) {
                speedLevel = speedRegexpMatch[1]
            }
            if (speedLevel === undefined) {
                speedLevel = 1
            }
        } else {
            let speedCount = this.supportedAttributes.speedList.length
            speedLevel = Math.round(raw_speed_int/100*speedCount)
        }
        iconSpan.innerHTML = `<ha-icon icon="mdi:numeric-${speedLevel}-box-outline"></ha-icon>`
        activeElement = fanboxa.querySelector('.fanbox .blades')
        activeElement.className = `blades level${speedLevel}`

        // Natural mode
        activeElement = fanboxa.querySelector('.var-natural')
        
         //p* fans do not report direct_speed and natural_speed
        if (!this.supportedAttributes.natural_speed_reporting && this.supportedAttributes.natural_speed) {
            if (mode === 'nature') {
                natural_speed = true
            } else if (mode === 'normal') {
                natural_speed = false
            } else {
                this.error(`Unrecognized mode for ${model} when updating natural mode state: ${mode}`)
                natural_speed = false
                this.error(`Defaulting to natural_speed = ${natural_speed}`)
            }
        }
        if (this.supportedAttributes.natural_speed) {
            if (natural_speed) {
                if (activeElement.classList.contains('active') === false) {
                    activeElement.classList.add('active')
                }
            } else {
                activeElement.classList.remove('active')
            }
        } else
        {
            activeElement.style.display='none'
        }

        // Sleep mode
        activeElement = fanboxa.querySelector('.var-sleep')
        if (this.supportedAttributes.sleep_mode) {
            if (raw_speed_int == 1) {
                if (activeElement.classList.contains('active') === false) {
                    activeElement.classList.add('active')
                }
            } else {
                activeElement.classList.remove('active')
            }
        } else
        {
            activeElement.style.display='none'
        }

        // Oscillation
        activeElement = fanboxa.querySelector('.var-oscillating')
        let fb = fanboxa.querySelector('.fanbox')
        if (oscillating) {
            if (fb.classList.contains('oscillation') === false) {
                fb.classList.add('oscillation')
            }
            if (activeElement.classList.contains('active') === false) {
                activeElement.classList.add('active')
            }
        } else {
            activeElement.classList.remove('active')
            fb.classList.remove('oscillation')
        }

        //Left and Right
        if (!this.supportedAttributes.rotationAngle) {
            fanboxa.querySelector('.left').style.display = 'none'
            fanboxa.querySelector('.right').style.display = 'none'
        }

        // Fan Animation
        if (this.config.disable_animation) {
            fanboxa.querySelector('.fanbox').style.display = 'none'
            this.card.style.height = '170px'
        }

    }
/*********************************** UI Settings ************************************/

    // Add to logs
    log() {
        //console.log(...arguments)
    }
    warn() {
        // console.log(...arguments)
    }
    error() {
        console.error(...arguments)
    }
}

customElements.define('fan-xiaomi', FanXiaomi);

const OptionsPlatform = [
  'xiaomi_miio_fan',
  'xiaomi_miio_airpurifier',
];

class ContentCardEditor extends LitElement {

  setConfig(config) {
    this.config = config;
  }

  static get properties() {
      return {
          hass: {},
          config: {}
      };
  }
  render() {
    var fanRE = new RegExp("fan\.")
    return html`
    <div class="card-config">
    <div class="row">
    <paper-input
          label="${this.hass.localize("ui.panel.lovelace.editor.card.generic.title")} (${this.hass.localize("ui.panel.lovelace.editor.card.config.optional")})"
          .value="${this.config.name}"
          .configValue="${"name"}"
          @value-changed="${this._valueChanged}"
      ></paper-input>
      </div>
      <div class="row">
      <ha-formfield label="Disable animation">
        <ha-switch
          .checked=${this.config.disable_animation}
          .configValue="${'disable_animation'}"
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      </div>
      <div class="row">
      <ha-formfield label="Disable immediate UI">
        <ha-switch
          .checked=${this.config.disable_immediate_UI}
          .configValue="${'disable_immediate_UI'}"
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      </div>
      <div class="row">
      <ha-formfield label="Use HA standard speeds (low/medium/high)">
        <ha-switch
          .checked=${this.config.use_standard_speeds}
          .configValue="${'use_standard_speeds'}"
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      </div>
      <div class="row">
      <ha-formfield label="Show sleep mode button">
        <ha-switch
          .checked=${this.config.force_sleep_mode_support}
          .configValue="${'force_sleep_mode_support'}"
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      </div>
      <div class="row">
      <paper-dropdown-menu
        label="Platform"
        .configValue=${'platform'}
        @value-changed=${this._valueChanged}
        class="dropdown"
        >
        <paper-listbox
          slot="dropdown-content"
          .selected=${(Object.values(OptionsPlatform).indexOf(this.config.platform))}
        >
          ${(Object.values(OptionsPlatform)).map(item => html` <paper-item>${item}</paper-item> `)}
        </paper-listbox>
      </paper-dropdown-menu>
      </div>
      <div class="row">
      <ha-entity-picker
        .label="${this.hass.localize(
          "ui.panel.lovelace.editor.card.generic.entity"
        )} (${this.hass.localize(
          "ui.panel.lovelace.editor.card.config.required"
        )})"
        .hass=${this.hass}
        .value=${this.config.entity}
        .configValue=${"entity"}
        .includeDomains=${includeDomains}
        @change=${this._valueChanged}
        allow-custom-entity
      ></ha-entity-picker>
      </div>
    </div>
    `
  }
  _focusEntity(e){
    // const target = e.target;
    e.target.value = ''
  }
  
  _valueChanged(e) {
    if (!this.config || !this.hass) {
      return;
    }
    const { target } = e;
    if (target.configValue) {
      if (target.value === '') {
        delete this.config[target.configValue];
      } else {
        this.config = {
          ...this.config,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    this.configChanged(this.config)
  }

  configChanged(newConfig) {
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true
    });
    event.detail = {config: newConfig};
    this.dispatchEvent(event);
  }
}

customElements.define("content-card-editor", ContentCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "fan-xiaomi",
  name: "Xiaomi Fan Lovelace Card",
  preview: true,
  description: "Xiaomi Smartmi Fan Lovelace card for HASS/Home Assistant."
});
