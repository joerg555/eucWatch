//handler
//set p8 type-obsolete-done from loader
//const touchtype="816"; //716|816|816s
//Const acctype="BMA421"; //BMA421|SC7A20
//fonts
require('Font7x11Numeric7Seg').add(Graphics);
//notifications
var notify={
	New:0,nIm:0,nInfo:0,nCall:0,nMail:0
};
notify.im=(Boolean(require('Storage').read('im.log')))?require('Storage').readJSON('im.log'):[];
notify.info=(Boolean(require('Storage').read('info.log')))?require('Storage').readJSON('info.log'):[];
notify.call=(Boolean(require('Storage').read('call.log')))?require('Storage').readJSON('call.log'):[];
function handleInfoEvent(event) {
	notify.nInfo++;
	notify.New++;
	let d=(Date()).toString().split(' ');
    let ti=(""+d[4]+" "+d[0]+" "+d[2]);
	notify.info.unshift("{\"src\":\""+event.src+"\",\"title\":\""+event.title+"\",\"body\":\""+event.body+"\",\"time\":\""+ti+"\"}");
	if (notify.info.length>10) notify.info.pop();
	if (set.def.dnd&&!notify.ring) {
		digitalPulse(D16,1,[80,50,80]);
		if (face.appCurr!="main"||face.pageCurr!=0) {
			face.go("main",0);
			face.appPrev="main";face.pagePrev=-1;
        }
	}
}
//settings - run set.upd() after changing BT settings to take effect.
var set={
  bt:0, //Incomming BT service status indicator- Not user settable.0=not_connected|1=unknown|2=webide|3=gadgetbridge|4=atc|5=esp32
  tor:0, //Enables/disables torch- Not user settable.
  ondc:0, //charging indicator-not user settable.
  btsl:0, //bt sleep status-not user settable.
  gIsB:0,//gat status-n.u.s- 0=not busy|1=busy 
  fmp:0, //find my phone-n.u.s.
  boot:getTime(), 
  gDis:function(){
	if (this.gIsB) {
		this.gIsb=2;
		if (global["\xFF"].BLE_GATTS) {
          if (global["\xFF"].BLE_GATTS.connected)
          global["\xFF"].BLE_GATTS.disconnect().then(function (c){this.gIsB=0;});
        }else gIsB=0;
     }
  },
  updateSettings:function(){require('Storage').write('setting.json', set.def);},
  resetSettings:function() {
	set.def = {
	name:"p8-EUCWatch", //Set the name to be broadcasted by the Bluetooth module. 
	timezone:3, //Timezone
	woe:1, //wake Screen on event.0=disable|1=enable
	wob:1, //wake Screen on Button press.0=disable|1=enable
	rfTX:4, //BT radio tx power, -4=low|0=normal|4=high
	cli:1, //Nordic serial bluetooth access. Enables/disables Espruino Web IDE.
	hid:0, //enable/disable Bluetooth music controll Service.
	gb:1,  //Notifications service. Enables/disables support for "GadgetBridge" playstore app.
	atc:0, //Notifications service. Enables/disables support for "d6 notification" playstore app from ATC1441.
	acc:1, //enables/disables wake-screen on wrist-turn. 
	dnd:1, //Do not disturb mode, if ebabled vibrations are on.
	hidT:"media", //joy/kb/media
	bri:3 //Screen brightness 1..7
	};
	set.updateSettings();
  },
  accR:function(){if (this.def.acc)acc.on(); else acc.off();},
  hidM:undefined, //not user settable.
  clin:0,//not settable
  upd:function(){ //run this for settings changes to take effect.
	if (this.def.hid==1&&this.hidM==undefined) {
		Modules.addCached("ble_hid_controls",function(){
		function b(a,b){NRF.sendHIDReport(a,function(){NRF.sendHIDReport(0,b);});}
		exports.report=new Uint8Array([5,12,9,1,161,1,21,0,37,1,117,1,149,5,9,181,9,182,9,183,9,205,9,226,129,6,149,2,9,233,9,234,129,2,149,1,129,1,192]);
		exports.next=function(a){b(1,a);};
		exports.prev=function(a){b(2,a);};
		exports.stop=function(a){b(4,a);};
		exports.playpause=function(a){b(8,a);};
		exports.mute=function(a){b(16,a);};
		exports.volumeUp=function(a){b(32,a);};
		exports.volumeDown=function(a){b(64,a);};});
		this.hidM=require("ble_hid_controls");
/*		if (this.def.hidT=="joy") this.hidM = E.toUint8Array(atob("BQEJBKEBCQGhAAUJGQEpBRUAJQGVBXUBgQKVA3UBgQMFAQkwCTEVgSV/dQiVAoECwMA="));
		else if (this.def.hidT=="kb") this.hidM = E.toUint8Array(atob("BQEJBqEBBQcZ4CnnFQAlAXUBlQiBApUBdQiBAZUFdQEFCBkBKQWRApUBdQORAZUGdQgVACVzBQcZAClzgQAJBRUAJv8AdQiVArECwA=="));
		else this.def.hidM = E.toUint8Array(atob("BQEJBqEBhQIFBxngKecVACUBdQGVCIEClQF1CIEBlQV1AQUIGQEpBZEClQF1A5EBlQZ1CBUAJXMFBxkAKXOBAAkFFQAm/wB1CJUCsQLABQwJAaEBhQEVACUBdQGVAQm1gQIJtoECCbeBAgm4gQIJzYECCeKBAgnpgQIJ6oECwA=="));
*/
  	}else if (this.def.hid==0 &&this.hidM!=undefined) {
		this.hidM=undefined;
		if (global["\xFF"].modules.ble_hid_controls) Modules.removeCached("ble_hid_controls");
    }
	if (!Boolean(require('Storage').read('atc'))) this.def.atc=0;
	if (this.def.atc) eval(require('Storage').read('atc'));
	else {
		NRF.setServices(undefined,{uart:(this.def.cli||this.def.gb)?true:false,hid:(this.def.hid&&this.hidM)?this.hidM.report:undefined });
		if (this.atcW) {this.atcW=undefined;this.atcR=undefined;} 
	}
	if (this.def.gb) eval(require('Storage').read('m_gb'));
	else {
		this.handleNotificationEvent=undefined;
		this.handleFindEvent=undefined;
		this.sendBattery=undefined;
		this.gbSend=undefined;
		global.GB=undefined;
	}		
    if (!this.def.cli&&!this.def.gb&&!this.def.atc&&!this.def.hid) { if (this.bt!=0) NRF.disconnect(); else{ NRF.sleep();this.btsl=1;}}
    else if (this.bt!=0) NRF.disconnect();
    else if (this.btsl==1) {NRF.restart();this.btsl=0;}
  }
};

set.def = require('Storage').readJSON('setting.json', 1);
if (!set.def) set.resetSettings();
//
//eval(require('Storage').read('handler.set')); //get defaults
E.setTimeZone(set.def.timezone);
function bdis() {
    Bluetooth.removeListener('data',ccon);
	E.setConsole(null,{force:true});
    if (!set.def.cli&&!set.def.gb&&!set.def.atc&&!set.def.hid){
      NRF.sleep();
      set.btsl=1;
    }	
	if (set.bt==1) handleInfoEvent({"src":"BT","title":"BT","body":"Disconnected"});
	else if (set.bt==2) handleInfoEvent({"src":"BT","title":"IDE","body":"Disconnected"});
	else if (set.bt==3) handleInfoEvent({"src":"BT","title":"GB","body":"Disconnected"});
	else if (set.bt==4) handleInfoEvent({"src":"BT","title":"ATC","body":"Disconnected"});
	else if (set.bt==5) handleInfoEvent({"src":"BT","title":"ESP","body":"Disconnected"});
  	set.bt=0; 
//	digitalPulse(D16,1,[100,50,50,50,100]); 
}
function bcon() {
	set.bt=1; 
//    digitalPulse(D16,1,100);
	if (set.def.cli==1||set.def.gb==1)  Bluetooth.on('data',ccon);
}
function ccon(l){ 
    var cli="\x03";
    var gb="\x20\x03";
	if (set.def.cli) {
		if (l.startsWith(cli)) {set.bt=2;Bluetooth.removeListener('data',ccon);E.setConsole(Bluetooth,{force:false});
		print("Welcome.\n** Working mode **\nUse devmode (Settings-Info-long press on Restart) for uploading files."); 
		handleInfoEvent({"src":"BT","title":"IDE","body":"Connected"});
		}
    }
    if (set.def.gb) if (l.startsWith(gb)){
		set.bt=3;Bluetooth.removeListener('data',ccon);E.setConsole(Bluetooth,{force:false});
		handleInfoEvent({"src":"BT","title":"GB","body":"Connected"});
		}
    if (l.length>5)  NRF.disconnect();
}
NRF.setTxPower(set.def.rfTX);
//E.setConsole(null,{force:true});
NRF.setAdvertising({}, { name:set.def.name,connectable:true });
NRF.on('disconnect',bdis);  
NRF.on('connect',bcon);
set.upd();
//face
var face={
  appCurr:"main",
  appPrev:"main",
  pageCurr:-1,
  pagePrev:-1,	
  pageArg:"",
  faceSave:-1,
  mode:0,
  offid:-1,
  offms:-1,
  off:function(page){ 
      if (this.pageCurr===-1) {print("face-1");return;}
      if (this.offid>=0) {clearTimeout(this.offid); this.offid=-1;}
      if (face[this.pageCurr]!=-1) this.offms=face[this.pageCurr].offms;
      this.offid=setTimeout((c)=>{
        this.offid=-1;
		//if (set.def.acc&&acc.tid==-1) acc.on();
		if (c===0||c===2) {
			if (this.appCurr==="main") {
				if (face[c].off) {
					if (set.def.touchtype!="816") i2c.writeTo(0x15,0xa5,3); 
					if (set.def.touchtype=="716") tfk.exit();	
					face[c].off();this.pageCurr=-1;face.pagePrev=c;
				}
			}else face.go(this.appCurr,1);
		}else if (face.appPrev=="off") {
			if (face[c].off) {
				if (set.def.touchtype!="816") i2c.writeTo(0x15,0xa5,3); 
				if (set.def.touchtype=="716") tfk.exit();	
				face.go("main",-1);face.pagePrev=c;
			}
		}else if (c>1) face.go(this.appCurr,0);
	  },this.offms,this.pageCurr);
  },
  go:function(app,page,arg){
    this.appPrev=this.appCurr;
	this.pagePrev=this.pageCurr;
    this.appCurr=app;
    this.pageCurr=page;
	if (this.pagePrev==-1&&w.gfx.isOn) {w.gfx.clear();w.gfx.off();}
    if (this.pagePrev!=-1) {
        face[this.pagePrev].clear();
    }
  	if (this.pageCurr==-1 && this.pagePrev!=-1) {
		if (set.def.touchtype=="716")tfk.loop=100;
		acc.go=0;
        face[this.pagePrev].off();
      if (this.offid>=0) {clearTimeout(this.offid); this.offid=-1;}
	  if (this.appCurr!=this.appPrev) eval(require('Storage').read(app));
		return;
	}
	if (this.appCurr!=this.appPrev) {
      face[1]=0;face[2]=0;face[5]=0;
	  this.appRoot=[this.appPrev,this.pagePrev,this.pageArg];
      eval(require('Storage').read(app));
    } 
	this.off(page);
	face[page].init(arg);	
	if(!w.gfx.isOn) {w.gfx.on();
		if (set.def.touchtype!="816") digitalPulse(D13,1,[10,50]);
		if (set.def.touchtype=="716"){tfk.loop=5;if( tfk.tid==-1) tfk.init();}
	}
	face[page].show(arg);
	if(arg) this.pageArg=arg;
  }
};
//touch 
var touchHandler = {
  timeout: function(){
	face.off(face.pagePrev);
  }
};
//charging notify
setWatch(function(s){
  var co;
  var g=w.gfx;
  if (s.state==1) {
	digitalPulse(D16,1,200); 
	co=col.raf;
	set.ondc=1;
  }else {
	digitalPulse(D16,1,[100,80,100]);
  	co=col.black;
	set.ondc=0;
  }
  if (face.pageCurr<0){
	if (global.w&&s.state==1) {
	  if (face.offid==-1){ g.clear();g.flip();}
	  g.setColor(0,col("black"));
	  g.setColor(1,col("lblue"));
	  let img = require("heatshrink").decompress(atob("wGAwJC/AA0D///4APLh4PB+AP/B/N/BoIAD/gPHBwv//wPO/4PH+F8gEHXwN8h4PIKgwP/B/4P/B/4PbgQPOg4POh+AB7sfB50/H5wPPv4PO/4PdgIPP94PNgfPB5sHB5+PB5sPB50fBgQPLjwPOn0OB5t8jwPNvAPO/APNgPwB53gB5sDB5/AB5sHwAPNh+Aj//4APLYAIPMj4POnwhBB5k8AgJSBB5V8LoQPL/BtDB5TRCKQIPJZwIEBSAIPJXwIEBMQQPJ4AEBKQIPJg4PCvAPKRgP+MQQPNYgYPKMQR/KLoMBMQIPLjxiCB5ccMQQPLnjeBB5reBB5zhDB5TeBB5reBB5s8B5s4bwIPMvDeBB5reBB5oDCB5d5B517bwIPNZwIPMu4PO/7OBB7oGCB5f+B738B7sBZwQPcGQQPMZwQPbgDOCB5gADB/4P/B/4PY/4AGB69/Bwv+B538B44Ar"));
	  g.drawImage(img,60,30);
      g.setFont("Vector",35);
      g.drawString(w.battVoltage(1)+"%",125-(g.stringWidth(w.battVoltage(1)+"%")/2),200);
	  g.flip();
	  if (face.offid!==-1) clearTimeout(face.offid);
	  face.offid=setTimeout(()=>{
	  	g.clear();g.off();face.offid=-1;
	  },2000);
      if(!g.isOn) g.on();
    }  
  }
},D19,{repeat:true, debounce:500,edge:0});  
//button 
//var button;
var press=true;
var l1=-1;
function buttonHandler(s){
  if ( l1 >=0) {clearTimeout(l1); l1=-1;}
  if (s.state==true) { 
    press=true;
	//toggle EUC on long press
    l1=setTimeout(() => {
      l1=-1;
      if (typeof euc !== 'undefined' ) {
		euc.tgl();press=false;
      }
    }, 1000);
   }else if (press==true && s.state==false)  { 
	press=false;
	if (face.pageCurr==-1) {
		digitalPulse(D16,1,[60,40,60]);
		if (global.euc){
			if (euc.conn!="OFF") face.go("euc",0);else face.go(face.appCurr,0);
		}else face.go(face.appCurr,0);
	}else { 
	  if (face.appCurr=="main"&&face.pagePrev!=-1&&face.pagePrev!=2) {
        if (set.def.acc==1) {
        acc.off();
        acc.go=0;
        setTimeout(function(t){
		  acc.on();
        },2000);
        }
        face.go("main",-1);
        digitalPulse(D16,1,100);
      }else{
      var to=face.pageCurr+1;
      if (to>=2) to=0;
      face.go(face.appCurr,to);
	  }
    }
  }
}
btn=setWatch(buttonHandler,BTN1, {repeat:true, debounce:10,edge:0});
//touch controller
//var i2c=I2C1;
var i2c=new I2C();
i2c.setup({scl:D7, sda:D6, bitrate:200000});
digitalPulse(D13,1,[5,50]);
var c;
if (set.def.touchtype=="816"){
setWatch(function(s){
  "ram";
  var tp=i2c.readFrom(0x15,7);
  if (face.pageCurr>=0) touchHandler[face.pageCurr](tp[1],tp[4],tp[6]);
  else if (tp[1]==5) {
    if (s.time-c<0.25) face.go(face.appCurr,0);
    c=s.time;
  }else if (/*tp[1]==1||*/tp[1]==1) face.go(face.appCurr,0);
},D28,{repeat:true, edge:"rising"}); 
}else if (set.def.touchtype=="816s"){
var lt,xt,yt,tt,tf;
//var ct=0;
setWatch(function(s){
  "ram";
var tp=i2c.readFrom(0x15,7);
//console.log(tp);
if (face.pageCurr>=0) {
  if (tp[3]==0) {
	if (tt) {clearTimeout(tt);tt=0;}
    xt=tp[4];yt=tp[6];lt=1;st=1;tf=1;
	return;
  }else if (tp[1]==0 && tf) {
    var a;
    //ct++;
    //if (ct>2){
    a=5;
	if (tp[6]>=yt+35) a=1;
	else if (tp[6]<=yt-35) a=2;
	else if (tp[4]<=xt-35) a=3;
	else if (tp[4]>=xt+35) a=4;
//    console.log(tp[4],xt,tp[6],yt,a,ct);
   	if (tt) {clearTimeout(tt);tt=0;}
    if (a!=5){
      touchHandler[face.pageCurr](a,xt,yt);
      ct=0;
      tf=0;
	  return;
    } else {  
	tt=setTimeout(()=>{
       touchHandler[face.pageCurr](a,xt,yt);
		tt=0;ct=0;
        tf=0;
    },20);  
    }
    return;
  }else if (tp[1]==5) {
  if (tt) {clearTimeout(tt);tt=0;}
    touchHandler[face.pageCurr](5,tp[4],tp[6]);
    tf=0;
	return;
  }else if (tp[1]==12) {
 	if (tt) {clearTimeout(tt);tt=0;}
    if (lt) touchHandler[face.pageCurr](12,tp[4],tp[6]);
    lt=0;
    tf=0;
	return;
  }
}else {
  if(tp[3]==0) tf=1;
  if (tp[1]==5 && tf) {
    if (s.time-c<0.25) face.go(face.appCurr,0);
    c=s.time;tf=0;
  }else if (tp[1]==1 && tf) {face.go(face.appCurr,0);tf=0;}
}
},D28,{repeat:true, edge:"falling"}); 
}else if (set.def.touchtype=="716"){
var tfk={
tid:-1,
x:0,
y:0,
do:0,
st:1,
loop:5,
init:function(){
   	"ram";
	var tp=i2c.readFrom(0x15,7);
//	print(tp);
	if (tp[3]==128) {
        if (this.time==-1) this.time=getTime();
        if (this.st) {
          if (face.pageCurr==-1){this.loop=5;face.go(face.appCurr,0);return;}
          this.st=0;
          this.do=1;
          this.x=tp[4];this.y=tp[6];
        }
        if (this.do===1&&getTime()-this.time>1){ 
            touchHandler[face.pageCurr](12,this.x,this.y);
            this.do=0;
        }else if (this.do===1&&tp[1]==0) {
            var a=0;
            if (tp[6]>=this.y+20) a=1;
	        else if (tp[6]<=this.y-20) a=2;
	        else if (tp[4]<=this.x-20) a=3;
	        else if (tp[4]>=this.x+20) a=4;
            if (a!=0) {
              this.do=0;
              touchHandler[face.pageCurr](a,this.x,this.y);
            }
        }else if (this.do===1){
            if (tp[1]==5||tp[1]==12){
              touchHandler[face.pageCurr](tp[1],this.x,this.y);this.do=0;
            }
        }
	}else if (tp[3]==255) {
		if (this.do===1){touchHandler[face.pageCurr](5,this.x,this.y);this.do=0;        }
		this.st=1;this.time=-1;
    }
	this.tid=setTimeout(function(t){
		t.tid=-1;
		t.init();
	},this.loop,this);
},
exit:function(){
    if (this.tid>=0) clearTimeout(this.tid);
    this.tid=-1;
    return true;
}
};	
}
//accelerometer(wake on look)
function getI16val(u8low, u8high) {
  var i16val = u8low | (u8high << 8);
  if (i16val >= 0x8000)
    i16val -= 0x10000;
  return i16val;
}

acc={
  loop:200,
  tid:-1,
  run:-1,
  go:1,
  up:0,
  yedge:250,
  xedge:20,
  on:function() {
        i2c.writeTo(0x18, 0x7d, 0x04);
        this.run = 1;
        this.init();
  },
  off:function(){
        i2c.writeTo(0x18, 0x7d, 0x04);
        this.run = -1;
  },
  ReadRaw:function(){
        var u8data;
        i2c.writeTo(0x18, 0x12);
        u8data = i2c.readFrom(0x18, 6);
        return u8data;
  },
  init:function (){
    "ram";
	if(this.run===-1) return;
    var data=this.ReadRaw();
	//print(data);
	if (200<data[3]&&data[3]<this.yedge) {
		if (data[1]<this.xedge||data[1]>=220) {
          //print(data);
          this.up=1;
          if (this.go){ 
            if (!w.gfx.isOn&&face.appCurr!=""){  
			if  (global.euc) {
              if (euc.conn!="OFF") face.go("euc",0);
              else{if (face.appCurr=="main") face.go("main",0);else face.go(face.appCurr,0);}
            }else{ 
				if (face.appCurr=="main") face.go("main",0);
				else face.go(face.appCurr,0);
			}
			this.loop=500;
		  }else if (w.gfx.isOn&&face.pageCurr!=-1) {
			if (face.appCurr=="main" && face.pageCurr==2) face.go("main",0);
		    else { if (set.tor==1)w.gfx.bri.set(face[0].cbri); else face.off(); }
			this.loop=200;
		  } 
         }
		}
    }else {this.loop=300;this.up=0;this.go=1;if (set.tor==1)w.gfx.bri.set(7); }
    this.tid=setTimeout(function(t){
		t.tid=-1;
		t.init(); 
    },this.loop,this);
  },
  getAccel: function() {
    var data = this.ReadRaw();
    var a = {};
    a.x = getI16val(data[0], data[1]);
    a.y = getI16val(data[2], data[3]);
    a.z = getI16val(data[4], data[5]);
    return a;
  }
};

if (set.def.acctype === "BMA421")
{
  i2c.writeTo(0x18, 0x40, 0x17);
  i2c.writeTo(0x18, 0x7c, 0x03);
} else /*if (set.def.acctype === "SC7A20")*/
{
  i2c.writeTo(0x18, 0x20, 0x47);  // 50hz xyz
  i2c.writeTo(0x18, 0x23, 0x80);
  acc.yedge = 235;
  acc.xedge = 30;
  acc.on = function () {
    i2c.writeTo(0x18, 0x20, 0x47);  // 50hz xyz
    this.run = 1;
    this.init();
  };
  acc.off = function () {
    // power down mode
    i2c.writeTo(0x18, 0x20, 0x00);
    this.run = -1;
  };
  acc.ReadRaw = function () {
    var u8data;
    i2c.writeTo(0x18, 0xa8);
    u8data = i2c.readFrom(0x18, 6);
    return u8data;
  };
}

//themes -todo
function col(no){
	switch (no) {
      case "black":return 0;case "white":return 4095;case "lblue":return 1535;case "blue":return 143;case "dblue":return 1375;case "blue1":return 1708;
	  case "raf":return 1453;case "raf1":return 1708;case "raf2":return 1963;case "raf3":return 2220;case "raf4":return 2474;case "raf5":return 3005;
  	  case "gray":return 2730;case "lgray":return 3003;case "dgray":return 1365;case "dgray1":return 1351;case "lgreen":return 1525;case "red":return 3840;
   	  case "dred":return 3925;case "dred1":return 3888;case "purple":return 3935;case "lyellow":return 4085;case "dyellow":return 4064;case "yellow":return 4080;
	  case "olive":return 170;
	}
}

var colo={ txt: 4095, txt1: 1535, txt2: 1365, txt3: 0,
  hdr: 1368, hTxt: 3003, bck: 1708, bck0: 0, bck1: 3003,
  bck2: 2730, bck3: 1963, btnEn: 1453, btnEn1: 1535, btnEn2: 3935,
  btnDs: 2730, btnDs1: 3003, btnDs2: 1963, btnAl: 4085, btnAl1: 3840,
  btnSt: 3935, btnTxt: 0, btnTxt1: 4095 };
/*
var colo={
	txt:col.white,
	txt1:col.lblue,
	txt2:col.dgray,
	txt3:col.black,
	hdr:col.dgray+3,
	hTxt:col.lgray,
	bck:col.raf1,
	bck0:col.black,
	bck1:col.lgray,
	bck2:col.gray,
	bck3:col.raf2,
	btnEn:col.raf,
	btnEn1:col.lblue,
	btnEn2:col.purple,
	btnDs:col.gray,
	btnDs1:col.lgray,
	btnDs2:col.raf2,
	btnAl:col.yellow,
	btnAl1:col.red,
	btnSt:col.purple,
	btnTxt:col.black,
   	btnTxt1:col.white
};
*/
//end
if ( Boolean(require("Storage").read("images"))) eval(require('Storage').read('images')); 
