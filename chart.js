class Chart{
    constructor(canv){
        this.chart_data = [];
        this.show_data = [];
        this.show_start = 0;
        this.show_end = 0;
        this.coords_of_candles = [];
        this.press = false;
        this.last_xmove = false;
        this.last_ymove = false;
        this.lasttouch_xmove = false;
        this.lasttouch_ymove = false;
        this.scale = false;
        this.touthstart_scrolltop = 0;
        this.canvas = canv;
        this.ctx = this.canvas.getContext("2d");
        this.linecolor = "#444";
        this.cursorlinecolor = "#aaa";
        this.growcolor = "#bdfa69";
        this.fallcolor = "#e159ab";
        this.fontcolor = "#555";
        this.loading = false;
        this.control();
        this.loading_spinner();
    }

    update(data, currencypair){
        clearInterval(this.loading);
        this.loading = false;
        this.chart_data = data;
        this.currencypair = currencypair;
        this.show_start = this.chart_data.length - 1 > 30 ?  this.chart_data.length-31 : 0;
        this.show_end = this.chart_data.length;
        this.show_data = this.chart_data.slice(this.show_start, this.show_end);

        this.draw();
    }

    updateLastCandle(candle){

    }

    control(){
        let MouseWheelHandler = e =>{
            let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
            this.scroll(delta, e);
            e.preventDefault();
        };

        this.canvas.onmousedown = () => {this.press = true;};

        this.canvas.onmouseup = () => {this.press = false;};

        window.onmouseup = () => {this.press = false;};

        window.onresize = ()=>{
            if(this.chart_data.length > 0){
                this.draw();
            }
        };


        this.canvas.onmousemove = e => {
            if(this.press)
                this.pan_event(e);
            else
                this.mouse_move_event(e);
        };

        let pinchX_1 = 0;
        let pinchX_2 = 0;
        let delta = 0;
        this.canvas.ontouchstart = e=>{
            pinchX_1 = 0;
            pinchX_2 = 0;
        };
        this.canvas.ontouchmove = e=>{
            if(e.changedTouches.length === 2){
                    let tch_1 = e.changedTouches[0].screenX;
                    let tch_2 = e.changedTouches[1].screenX;
                    let dlast = Math.abs(pinchX_2 - pinchX_1);
                    let dnow = Math.abs(tch_2 - tch_1);
                    if(Math.abs(dnow - dlast) < 3){
                        return false;
                    }

                    if((dnow) > (dlast)){
                        delta = 1;
                    }
                    else{
                        delta = -1;
                    }

                    pinchX_1 = tch_1;
                    pinchX_2 = tch_2;
            }
            if(e.changedTouches.length === 1){
                let tch_1 = e.changedTouches[0].screenX;
                if(Math.abs(pinchX_1 - tch_1) < 3){
                    return false;
                }
                this.pan_event(e, true);
                pinchX_1 = tch_1;
            }
        };

        this.canvas.addEventListener("mousewheel", MouseWheelHandler, false);

        this.canvas.addEventListener("DOMMouseScroll", MouseWheelHandler, false);


    }

    loading_spinner(){
        let start = new Date();
        let lines = 16,
            cW = 100,
            cH = 100;

        this.canvas.width = this.canvas.parentNode.clientWidth*1;
        this.canvas.height = this.canvas.parentNode.clientHeight*1;
        let draw = () => {
            let rotation = parseInt(((new Date() - start) / 1000) * lines) / lines;

            this.ctx.save();
            this.ctx.clearRect(0, 0 , this.canvas.width, this.canvas.height);
            this.ctx.translate(this.canvas.width/2 , this.canvas.height/2 );
            this.ctx.rotate(Math.PI * 2 * rotation);
            for (var i = 0; i < lines; i++) {

                this.ctx.beginPath();
                this.ctx.rotate(Math.PI * 2 / lines);
                this.ctx.moveTo(cW / 9, 0);
                this.ctx.lineTo(cW / 4, 0);
                this.ctx.lineWidth = cW / 40;
                this.ctx.strokeStyle = "rgba(90,90,90," + i / lines + ")";
                this.ctx.stroke();
            }
            this.ctx.restore();
        };
        this.loading = setInterval(draw, 1000 / 30);
    }

    mouse_move_event(e){
        if(this.chart_data.length === 0)
            return false;
        let [x,y] = this.getCanvPos(e);

        if(x > this.canvas.width - this.params.margin.right)
            return false;
        if(y > this.canvas.height - this.params.margin.bottom)
            return false;
        if(!this.last_xmove)
            this.last_xmove = x;
        if(!this.lastmouse_ymove)
            this.lastmouse_ymove = y;
        if((Math.abs(y - this.lastmouse_ymove) < 5) && (Math.abs(x - this.last_xmove) < this.cndlwidth)){
            return false;
        }
        this.draw_cursor(x,y);
    }

    pan_event(e, touch = false){
        let x,y;
        let move;
        if(touch){
            [x,y] = this.getCanvPos({
                clientX: e.changedTouches[0].clientX,
                clientY: e.changedTouches[0].clientY
            });
        }
        else
            [x,y] = this.getCanvPos(e);

        if(x > this.canvas.width - this.params.margin.right)
            return false;
        if(y > this.canvas.height - this.params.margin.bottom)
            return false;

        if(this.chart_data.length === 0)
            return false;


        if (Math.abs(x - this.last_xmove) < 9 && Math.abs(y - this.last_ymove) < 9 )
            return false;

        if(this.show_data.length < 31){
            move = 2;
        }
        else{
            move = parseInt(this.show_data.length/10);
        }

        if(!this.last_xmove || !this.last_ymove){
            this.last_xmove = x;
            this.last_ymove = y;
            return false;
        }
        if (this.last_xmove <= x) {
            this.show_start = (this.show_start - move) < 0 ? 0 : this.show_start - move;
            this.show_end = (this.show_end - move) < (this.show_data.length ) ? this.show_data.length : this.show_end - move;
            this.show_data = this.chart_data.slice(this.show_start, this.show_end);
            this.draw_cursor(x, y);
            this.last_xmove = x;
            this.last_ymove = y;
        }
        else if (this.last_xmove > x){
            this.show_end = (this.show_end + move) > (this.chart_data.length ) ? this.chart_data.length  : (this.show_end + move);
            if (this.show_end < this.chart_data.length - 1)
                this.show_start = (this.show_start + move) < 0 ? 0 : this.show_start + move;
            this.show_data = this.chart_data.slice(this.show_start, this.show_end);
            this.draw_cursor(x, y);
            this.last_xmove = x;
            this.last_ymove = y;
        }
    }

    scroll(delta, e, touch = false){

        //showModalContent();
        if(this.chart_data.length === 0)
            return false;

        let incdec = parseInt(this.show_data.length * 0.1);

        let newstart;
        if(delta < 0){
            newstart = this.show_start - (incdec === 0 ? 1 : incdec);
            this.show_start = newstart > 0 ? newstart  : 0;
            this.show_end = (this.show_end + incdec) > (this.chart_data.length )  ? this.chart_data.length : this.show_end + incdec;
        }
        else{
            if((this.show_end - this.show_start) > 30){
                newstart = this.show_start + (incdec === 0 ? 1 : incdec);
                this.show_start = newstart > 0 ? newstart  : 0;
            }
        }


        this.show_data = this.chart_data.slice(this.show_start, this.show_end);
        this.draw();
        if(!touch) {
            let [x, y] = this.getCanvPos(e);
            this.draw_cursor(x, y, true);
        }

    }

    draw_x_axis(p){
        let x_step = this.digitsFormat((this.params.end-this.params.begin)/9);
        let minute = 60;
        let hour = 3600;
        let day = 86400;
        let month = 2592000;
        let x_start;

        let time_spread = this.params.end-this.params.begin;

        let x_axis_draw = min_period => {
            let preiod = parseInt(time_spread / min_period);
            preiod = parseInt(preiod / 5) * min_period;

            let mod = (this.params.begin % preiod);
            x_start = mod === 0 ? this.params.begin : this.params.begin - mod + preiod;

            while (x_start < this.params.end) {
                let date = new Date(x_start * 1000);
                let d = this.params.margin.left + (x_start - this.params.begin) * this.params.cwr;
                let datestr;
                let marg = 15;
                this.ctx.strokeStyle = this.linecolor;
                this.ctx.textAlign = "center";

                if (time_spread < day*7){
                    datestr = date.toLocaleTimeString().split(":").slice(0, 2).join(":");
                    if(datestr === "0:00"){
                        datestr = String(date.getDate()).padStart(2, "0")+"."+String((parseInt(date.getMonth()+1))).padStart(2, "0");
                        marg = 25;
                    }
                }
                else{
                    datestr = String(date.getDate()).padStart(2, "0")+"."+String((parseInt(date.getMonth()+1))).padStart(2, "0");
                }
                this.ctx.font = "12px Arial";
                this.ctx.fillText(datestr, d, this.canvas.height - this.params.margin.bottom + marg);
                this.ctx.beginPath();
                this.ctx.moveTo(d, this.canvas.height - this.params.margin.bottom);
                this.ctx.lineTo(d, this.canvas.height - this.params.margin.bottom + 5);
                this.ctx.stroke();

                x_start += preiod;
            }
        };

        if(time_spread > day*3){
            x_axis_draw(hour*4);
        }
        else if(time_spread > day){
            x_axis_draw(hour);
        }
        else if(time_spread > hour)
        {
            x_axis_draw(hour);
        }
    }

    draw_y_axis(){
        let digit = (number, current = 0) => {
            let newdig;
            if(number > 10){
                current++;
                newdig = number/10;
                if(newdig > 10){
                    return digit(newdig, current);
                }
                else{
                    return current;
                }
            }
            else if(number < 1){
                newdig = number*10;
                current--;
                if(newdig < 0.1){
                    return digit(newdig, current);
                }
                else{
                    return current;
                }
            }
            else{
                return current;
            }
        };

        let y_step_gen = spread => {
            let razr = digit(y_spred);
            let step = Math.pow(10, razr);
            let rate = spread/step;

            if(rate < 0.3)
                return step/40;

            else if(rate < 0.5)
                return step/25;

            else if(rate < 1){
                return step/10;
            }
            else if(rate < 2)
                return step/5;

            else if(rate < 3)
                return step/2.5;

            else if(rate < 5)
                return step/2;

            else
                return step;

        };

        let y_spred = this.params.max-this.params.min;

        let y_step = y_step_gen(y_spred);

        let y_pos = this.params.min - (this.params.min  % y_step) + y_step;

        while (y_pos < this.params.max){
            y_pos = this.decimation_currency(y_pos);

            let d = this.params.ch - this.params.margin.bottom - (y_pos - this.params.min) * this.params.chr;

            this.ctx.strokeStyle = this.linecolor;
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width - this.params.margin.right, d);
            this.ctx.lineTo(this.canvas.width - this.params.margin.right + 5, d);
            this.ctx.font = "12px Arial";
            this.ctx.fillText(y_pos < 0.0001 ? y_pos.toFixed(8) : y_pos, this.canvas.width-this.params.margin.right + 8, d + 3);
            this.ctx.stroke();
            y_pos += y_step;
        }
    }

    draw_candle_and_vol(){
        let cndlwidth = this.params.cw / ((this.show_data.length-1) * 4);
        if(cndlwidth < .5)
            cndlwidth = .5;
        else if(cndlwidth > 5)
            cndlwidth = 5;
        this.cndlwidth = cndlwidth;
        this.coords_of_candles = [];
        this.show_data.forEach(item=>{
            let c = this.params.ch - this.params.margin.bottom - ((item.close - this.params.min) * this.params.chr);
            let l = this.params.ch - this.params.margin.bottom - ((item.low - this.params.min) * this.params.chr);
            let h = this.params.ch - this.params.margin.bottom - ((item.high - this.params.min) * this.params.chr);
            let o = this.params.ch - this.params.margin.bottom - ((item.open - this.params.min) * this.params.chr);
            let x = (item.date - this.params.begin) * this.params.cwr  + this.params.margin.left;

            if(c < o){
                this.ctx.strokeStyle = this.growcolor;
                this.ctx.fillStyle = this.growcolor;
            }
            else{
                this.ctx.strokeStyle = this.fallcolor;
                this.ctx.fillStyle = this.fallcolor;
            }

            this.ctx.beginPath();

            if(o === c){
                this.ctx.moveTo(x-cndlwidth, o);
                this.ctx.lineTo(x+cndlwidth, o);
                this.ctx.stroke();
            }
            else{
                this.ctx.moveTo(x, l);
                this.ctx.lineTo(x, h);
                this.ctx.stroke();
                this.ctx.moveTo(x, o);
                this.ctx.fillRect(x - cndlwidth, o, cndlwidth * 2, c - o)
            }
            this.ctx.fillStyle = "black";
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillRect(x - cndlwidth, this.canvas.height - this.params.margin.bottom, cndlwidth * 2, -this.params.cvr * item.vol);
            this.ctx.globalAlpha = 1;

            this.coords_of_candles.push(x + cndlwidth);

        });
    }

    draw_cursor(x, y, only_cursor = false){
        if(!only_cursor)
            this.draw();
        if(!this.params){

            return false;
        }
        this.ctx.strokeStyle = this.cursorlinecolor;
        this.ctx.fillStyle = this.cursorlinecolor;
        this.ctx.moveTo(x, this.params.margin.top);
        this.ctx.lineTo(x, this.canvas.height - this.params.margin.bottom);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.params.margin.left, y);
        this.ctx.lineTo(this.canvas.width - this.params.margin.right, y);

        this.ctx.font = "12px Arial";
        this.ctx.textAlign = "left";
        let rate = (this.params.ch - y  - this.params.margin.bottom)/this.params.chr+this.params.min;
        this.ctx.fillRect(this.canvas.width - this.params.margin.right, y - 10 , 80, 20);
        this.ctx.fillStyle = "#fefefe";
        this.ctx.fillText(this.digitsFormat(rate), this.canvas.width - this.params.margin.right + 8 , y + 4);


        this.ctx.stroke();
        this.last_xmove = x;
        this.lastmouse_ymove = y;

        this.ctx.fillStyle = this.fontcolor;

        let candle = this.getcandle(x);
        if(!candle)
            return false;
        //this.ctx.textAlign = "right";
        this.ctx.fillText(new Date(parseInt((this.params.begin + x/this.params.cwr)*1000)).toISOString().replace("T", " ").slice(0,16), this.params.margin.left , this.params.margin.top + 15 );
        this.ctx.fillText("V: "+this.digitsFormat(candle.vol, "vol") + " " + this.currencypair[0], this.params.margin.left , this.params.margin.top + 30 );
        this.ctx.fillText("O: "+this.digitsFormat(candle.open), this.canvas.width - this.params.margin.right - 90 , this.params.margin.top + 15);
        this.ctx.fillText("H: "+this.digitsFormat(candle.high), this.canvas.width - this.params.margin.right - 90 , this.params.margin.top + 30);
        this.ctx.fillText("C: "+this.digitsFormat(candle.close), this.canvas.width - this.params.margin.right - 90 , this.params.margin.top + 45);
        this.ctx.fillText("L: "+this.digitsFormat(candle.low), this.canvas.width - this.params.margin.right - 90 , this.params.margin.top + 60);

    }

    draw(){
        if(this.chart_data.length === 0){
            return false;
        }
        this.canvas.width = this.canvas.parentNode.clientWidth*1;
        this.canvas.height = this.canvas.parentNode.clientHeight*1;

        let cw = this.canvas.width;
        let ch = this.canvas.height;
        let volume_height = 60;

        let margin = {
            top:20,
            bottom: 30,
            left: 5,
            right: 80,
        };
        let padding = 5;
        let mpv = margin.top + margin.bottom + padding*2;
        let mph = margin.left + margin.right + padding*2;

        let [min, max, maxvol] = this.getMaxMin(this.show_data);


        let begin = this.show_data[0].date;
        let end = this.show_data[this.show_data.length-1].date;

        let chr = (ch - mpv)/(max-min);
        let cwr = (cw - mph)/(end-begin);
        let cvr = (volume_height)/(maxvol);


        this.params = {
            max:max,
            min:min,
            maxvol:maxvol,
            chr:chr,
            cwr:cwr,
            cvr:cvr,
            mpv:mpv,
            mph:mph,
            margin:margin,
            padding:padding,
            ch: ch,
            cw: cw,
            end:end,
            begin:begin,
        };


        this.ctx.fillStyle = this.linecolor;
        this.ctx.font = "14px Arial";
        this.ctx.fillText(this.currencypair.join("/"), margin.left, margin.top - 5);
        this.ctx.beginPath();

        this.ctx.strokeStyle = this.linecolor;
        this.ctx.moveTo(margin.left, this.canvas.height-margin.bottom);
        this.ctx.lineTo(this.canvas.width-margin.right, this.canvas.height-margin.bottom);
        this.ctx.lineTo(this.canvas.width-margin.right, margin.top);
        this.ctx.stroke();


        this.draw_y_axis();
        this.draw_x_axis();
        this.draw_candle_and_vol();


        //candles

    }

    getMaxMin(data){
        let min;
        let max = 0;
        let maxvol = 0;
        data.forEach(item=>{
            if(item.high > max)
                max = item.high;
            if(!min)
                min = item.low;
            else if(item.low < min)
                min = item.low;
            if(item.vol > maxvol){
                maxvol = item.vol;
            }

        });
        return [min, max, maxvol];
    }

    decimation_currency(val) {
        return Math.floor(val * 100000000)/100000000;
    }

    getCanvPos(e) {
        var rect = this.canvas.getBoundingClientRect();
        return [
            (e.clientX - rect.left) / (rect.right - rect.left) * this.canvas.width,
            (e.clientY - rect.top) / (rect.bottom - rect.top) * this.canvas.height
        ];
    }

    digitsFormat(n, type = "rate"){
        if(n === ""){
            return "";
        }
        if (type === "summ"){
            return Math.round(n * 100000000 ) / 100000000;
        }
        else if (type === "rate")
            if (n === 0)
                return 0;
            else if ( n > 1000000000)
                return Math.floor(n);
            else if ( n > 1000000)
                return Math.floor(n * 10)/10;
            else if ( n > 999.99)
                return Math.floor(n * 100)/100;
            else if ( n > 99.999)
                return Math.floor(n * 1000)/1000;
            else if ( n > 9.9999)
                return Math.floor(n * 10000)/10000;
            else if ( n > 0.99999)
                return Math.floor(n * 10000)/10000;
            else if ( n > 0.0999999)
                return Math.floor(n * 100000)/100000;
            else if ( n > 0.009999999)
                return Math.floor(n * 1000000)/1000000;
            else if ( n > 0.000999999)
                return Math.floor(n * 1000000)/1000000;
            else if ( n > 0.000099999)
                return Math.floor(n * 10000000)/10000000;
            else
                return Number(n).toFixed(8);

        else
        if ( n > 1000000000)
            return Math.round(n / 1000000000) + "mm";
        else if (n > 1000000)
            return Math.round(n / 1000000) + "m";
        else if (n > 1000)
            return Math.round(n / 1000) + "k";
        else if (n > 100)
            return Math.round(n * 10 ) / 10;
        else if (n > 10)
            return Math.round(n * 100 ) / 100;
        else
            return Math.round(n * 1000 ) / 1000;

    }

    getcandle (x) {
        for(let i = 0; i < this.coords_of_candles.length; i++){
            if(this.coords_of_candles[i]> x){
                return this.show_data[i];
            }
        }
    };
}
