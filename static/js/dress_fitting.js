function loadJQuery() {
    let oScript = document.createElement("script");
    oScript.type = "text/javascript";
    oScript.charset = "utf-8";		  
    oScript.src = "./static/js/jquery.js";	
    document.getElementsByTagName("head")[0].appendChild(oScript);
}

function loadJcrop() {
    let oScript = document.createElement("script");
    oScript.type = "text/javascript";
    oScript.charset = "utf-8";		  
    oScript.src = "./static/js/Jcrop/JcropDoc/js/jquery.Jcrop.min.js";	
    document.getElementsByTagName("head")[0].appendChild(oScript);
}

function loadOpenCV() {
    let oScript = document.createElement("script");
    oScript.type = "text/javascript";
    oScript.charset = "utf-8";		  
    oScript.src = "https://docs.opencv.org/master/opencv.js";	
    document.getElementsByTagName("head")[0].appendChild(oScript);
}

//loadJQuery();
//loadJcrop();
//loadOpenCV();

/* const model_Src=$('#models_wrap>ul>li>.on').attr("src");
const cloth_Src=$("#clothes_wrap>ul>li>.on").attr("src");
let modelNum = model_Src.slice(model_Src.lastIndexOf('/')+1,model_Src.lastIndexOf('.'));
let clothesNum=cloth_Src.slice(cloth_Src.lastIndexOf('/')+1,cloth_Src.lastIndexOf('.'));

let newSrc = `./static/img-sample-new/result/${modelNum}_${clothesNum}.jpg`; 
$("#main_pic_wrap>img").attr("src",newSrc);
console.log($("#main_pic_wrap>img").attr("src")); */

window.onload=()=>{
    console.log(`edit img width : ${$("#editImg_con").css("width")}`);
    console.log(`edit img height : ${$("#editImg_con").css("height")}`);
}

let jCropApi=null;
let xhp=null;
    $("#editImg_wrap .resize_btn").on("click",function(){
        const id = $(this).attr("id");
        let xAxis =parseFloat($("#xAxis").val());
        let yAxis = parseFloat($("#yAxis").val());
        let wLength=parseFloat($("#wLength").val());
        let hLength=parseFloat($("#hLength").val());
        console.log(xAxis);
        console.log(yAxis);
        let newHLength;let newWLength; let x1Offset;let y1Offset;
        if(id=='minusBtn'){
            newHLength = hLength*0.8;
        }else{
            newHLength = hLength*1.25;
        }
        newWLength = newHLength*0.75;
        x1Offset = (wLength-newWLength)/2;
        y1Offset = (hLength-newHLength)/2;
        console.log("nH : "+newHLength+" nW : "+newWLength+" x1Off : "+x1Offset +" y1Off : "+y1Offset);
        
        let newX1=xAxis+x1Offset;
        let newY1=yAxis+y1Offset;
        let newX2=xAxis+newWLength;
        let newY2=yAxis+newHLength;
        console.log("x1 : "+newX1+" y1 : "+newY1+" x2 : "+newX2 +" y2 : "+newY2);
       $("#editImg").Jcrop({
            bgFade:true,
            bgOpacity:0.5,
            allowResize:true,
            aspectRatio:0.75,
            onSelect:uploadCoords,
            setSelect:[newX1,newY1,newX2,newY2]
        });
    })

    $("#editImg_wrap #cutBtn").on("click",function(event){ 
        imgCropApply();
    })

    $("#editImg_wrap .fa-undo-alt").on("click",function(){
        $("#editImg").attr({"src":"#"});
        jCropApi.destroy();
        jCropApi=null;
        $("#editImg_con").hide();
    });

    let originalImgCanvas=null;
    let originalURI=null;

    //cropping 할 때 이미지 canvas에다 그리는 메서드
    function canvasDrawImage(src){
        return new Promise(function(resolve,reject){
            let dataURI;
            let pair;
            let preImage = new Image();
            let originalImgCanvasCtx=null;

            let height; let width;
            let top; let left;
            

            preImage.src=src;
            preImage.onload=function(){
                
                let canvas = document.createElement('canvas');
                originalImgCanvas = document.createElement('canvas');
                    
                let canvasContext = canvas.getContext('2d');
                originalImgCanvasCtx = originalImgCanvas.getContext('2d');
                
                
                if(preImage.width>preImage.height){
                    width = 475;
                    height= (preImage.height/preImage.width)*width;
                    left = 0;top = (width-height)/2;
                }else if(preImage.width<=preImage.height){
                    height = 475;
                    width = (preImage.width/preImage.height)*height;
                    top = 0; left = 0;
                }
                
                canvas.width = width;
                canvas.height = height;
                originalImgCanvas.width = preImage.width;
                originalImgCanvas.height = preImage.height;
                
                canvasContext.drawImage(preImage,0,0,canvas.width,canvas.height);
                originalImgCanvasCtx.drawImage(preImage,0,0,originalImgCanvas.width,originalImgCanvas.height);
                dataURI = canvas.toDataURL("image/jpeg");
                originalURI=originalImgCanvas.toDataURL("image/jpeg");
                $("#editImg").css({"height":height+"px","width":width+"px"}).attr({"src":dataURI});
                pair={width:width,height:height,top:top,left:left};
                resolve(pair);
            }
        })
    }
    //이미지 crop 할 영역 지정하주는 메서드
    function imgCropDesignate(pair){
        let x1,x2,y1,y2;
        
        let width = pair.width;
        let height = pair.height;
        let top = pair.top;
        let left = pair.left;
        let jcropHolderCss={
            "top":top.toString()+"px",
            "left":left.toString()+"px",
        }

        let nWidth = parseFloat(width);
        let nHeight = parseFloat(height);

        x1=0;y1=0;
        const entireWidth = parseInt($("#editImg_wrap>div:first-child").width());
        const croppedWidth = nHeight*0.75;
        
        //console.log(entireWidth);
        x1=(entireWidth-croppedWidth)/2;
        x2=parseFloat(x1+nWidth);y2=parseFloat(y1+nHeight);
        
        /* let wlength = ;let hlength = 1024;
        x1=(wlength-nWidth)/2;y1=(hlength-nHeight)/2;
        x2=x1+wlength;y2=y1+hlength;*/
        
        $("#editImg").Jcrop({
            bgFade:true,
            bgOpacity : 0.5,
            aspectRatio:0.75,
            allowResize:true,
            setSelect : [x1,y1,x2,y2],
            onSelect : uploadCoords,},
            function(){
                jCropApi=this;
                //여기서 this는 jCrop객체임..ㅇㅅㅇ
        })
        


        $(".jcrop-dragbar").off("click");
        $(".jcrop-holder").css(jcropHolderCss);
        
        $(".jcrop-holder>.jcrop-tracker").off("mousedown");
        $("#editImg_wrap>div").css({"user-select":"none"});
        $(".ord-s").off("click");
        $(".ord-e").off("click");
        $(".ord-w").off("click");
        $(".ord-n").off("click");
    }

    //이미지 crop 할 영역 좌표 & 높히 & 넒이 지정해주는 메서드
    function uploadCoords(crop){
        $("#xAxis").val(crop.x);
        $("#yAxis").val(crop.y);
        $("#wLength").val(crop.w);
        $("#hLength").val(crop.h);
    }


    //cropped 된 이미지 blob로 변환후 서버에 전송해주는 메서드
    function saveAndSendCanvas(canvas){
        let dataURI = canvas.toDataURL('image/jpeg','octet-stream');
        
        let id = $("#editImg").attr("mode");
        //받아온 이미지의 base64형태의 uri값을 decode해준다..
        const decodImg = atob(dataURI.split(',')[1]);
        let array=[];
        //바이트 배열로 변환 후 저장
        for(let i =0;i<decodImg.length;i++){
            array.push(decodImg.charCodeAt(i));
        }
        const file = new Blob([new Uint8Array(array)],{'type':'image/jpeg'});
        let formData = new FormData();
        const fileName = 'dress_fitting_img'+new Date()+'.jpeg';
        formData.append("img_upload",file,fileName);
        formData.append("upload_type",id);
        //formData.append("id",id);
        $("#editImg_con").hide();
        $.ajax({
            url:'/upload_dress_img',
            type:'post',
            data:formData,
            processData:false,
            contentType:false,
            success:function(resp){
                let $li;
                let src = './static/'
                if(id=='modelPic'){src=src+'img_model/'+resp+'.jpeg';}
                else{src=src+'img_dress/'+resp+'.jpeg';}
                

                if(id=='modelPic'){
                    $li=$("#models_wrap>ul>li").eq(0).clone(true);
                    $("#models_wrap>ul>li>img").removeClass("on");
                    $("#models_wrap>ul").append($li);
                    $li.children('img').attr({"src":src,"display-mode":"upload"}).addClass("on");
                    $("#clothes_wrap>ul>li>img").removeClass("on");
                }else if(id=='dressPic'){
                    $li=$("#clothes_wrap>ul>li").eq(0).clone(true);
                    $("#clothes_wrap>ul>li>img").removeClass('on');
                    $li.children('img').attr({"src":src,"display-mode":"upload"})
                    .addClass("on");
                    $("#clothes_wrap>ul").append($li);
                    $("#models_wrap>ul>li>img").removeClass("on");
                }
                originalImgCanvas=null;
                originalImgCanvasCtx=null;
            },
            error:function(resp){
                console.log(resp);
            }
        });
    }
   
    //이미지 서버에 보내기 전에 원본 이미지를 비율에 맞게 자르는 메서드
    function imgCropApply(){
        if(parseInt($("wLength").val()=="NaN")){
            jCropApi.destroy;jCropApi=null;
            return false;
        }else{
            let img = new Image();
            img.src = originalURI;//이미지를 로드시킴...
            let originWidth=originalImgCanvas.width;
            let originHeight=originalImgCanvas.height;
            let x1 = parseFloat($("#xAxis").val());let y1 = parseFloat($("#yAxis").val());
            let width = parseFloat($("#wLength").val());let height = parseFloat($("#hLength").val()); 
            let x2= x1+width; let y2 = y1+height;

            editImgWidth = parseFloat($("#editImg").css("width"));
            editImgHeight = parseFloat($("#editImg").css("height"));
            
            img.onload=function(){
                let canvas = document.createElement('canvas');
                let canvasContext = canvas.getContext('2d');
                
                let newX1 = parseFloat(x1/editImgWidth)*parseInt(originalImgCanvas.width);
                let newY1= parseFloat(y1/editImgHeight)*parseInt(originalImgCanvas.height);
                let newX2 = parseFloat(x2/editImgWidth)*parseInt(originalImgCanvas.width);
                let newY2 = parseFloat(y2/editImgHeight)*parseInt(originalImgCanvas.height);
                let newWidth = newX2-newX1; let newHeight = newY2-newY1;
                    
                canvas.width=newWidth;
                canvas.height=newHeight;

                canvasContext.drawImage(
                    this,
                    newX1,
                    newY1,
                    newWidth,
                    newHeight,
                    0,
                    0,
                    newWidth,
                    newHeight
                );
                $("#editImg").attr({"src":canvas.toDataURL("image/jpeg")});
                //saveAndSendCanvas(canvas);
                originCanvas=null;
                saveAndSendCanvas(canvas);
            }
            jCropApi.destroy();
            jCropApi=null;
        }
    }

    $("ul>li>img").on("click", function(){
        const id=$(this).closest('div').attr("id");
        if(id=='models_wrap'){
            $("#models_wrap>ul>li>img").removeClass("on");
            otherDisplayMode=$("#clothes_wrap>ul>li>.on").attr("display-mode");
        }else if(id=='clothes_wrap'){
            $("#clothes_wrap>ul>li>img").removeClass("on");
            otherDisplayMode=$("#models_wrap>ul>li>.on").attr("display-mode");
        }
        $(this).addClass("on"); 
    })

    //옷입히는 코드
    $("#main_pic_con #main_pic_wrap #dress").on("click",async function(){
        const id=$(this).closest('div').attr("id");
        
        const displayMode=$('#models_wrap>ul>li>.on').attr("display-mode");
        let otherDisplayMode=$("#clothes_wrap>ul>li>.on").attr("display-mode");
        if(displayMode==undefined || otherDisplayMode==undefined){
            alert("모델사진과 옷사진 모두 클릭해주세요");
            return false;
        }
        console.log(displayMode);
        console.log(otherDisplayMode);
        if(displayMode==='sample'&&otherDisplayMode==='sample'){
            //옷,모델 모두 sample 이미지 일 때
            const modelSrc=$('#models_wrap>ul>li>.on').attr("src");
            const clothSrc=$("#clothes_wrap>ul>li>.on").attr("src");
            let modelNum = modelSrc.slice(modelSrc.lastIndexOf('/')+1,modelSrc.lastIndexOf('.'));
            let clothesNum=clothSrc.slice(clothSrc.lastIndexOf('/')+1,clothSrc.lastIndexOf('.'));
            
            /* let modelNum=modelSrc.slice(modelSrc.lastIndexOf("/")+1,modelSrc.lastIndexOf("_"));
            
            let clothesNum=clothesSrc.split('/')[3]
            clothesNum = clothesNum.slice(clothesNum.indexOf('_')+1,clothesNum.lastIndexOf("_")); */
            $("#main_pic_wrap>img").attr({"src":"./static/img/loading.gif"});
            $("#dress").css({"background-color":"#81c147"}).text("loading");
            setTimeout(()=>{
                let newSrc = `./static/img-sample-new/result/${modelNum}_${clothesNum}.jpg`; 
                $("#main_pic_wrap>img").attr({"src":newSrc});
                $("#dress").css({"background-color":"#ff4d5c"}).text("try-virtual-fitting");
            },3500)
        }else{
            const previewsMainImgSrc= $("#main_pic_wrap>img").attr("src");
            //둘 중 하나는 유저가 업로드한 이미지 일때.
            let modelSrc=$('#models_wrap>ul>li>.on').attr("src");
            let dressSrc=$("#clothes_wrap>ul>li>.on").attr("src");
            if(modelSrc==undefined||dressSrc==undefined){
                alert("모델사진과 옷사진 모두 클릭해주세요");
                return false;
            }
            
                //※xHttpRequest 에서의 readyState 요소:
                //0: 객체만 생성 : uninitialized
                //1:open메서드 호출 : Loading
                //2:send 메서드 호출 : status 헤더가 도착하지 않은 상태 : loaded
                //3:데이터의 일부를 받은 상태 : Interactive
                //4:데이터 전부 받은 상태 : Completed
                
            
            $("#dress").css({"background-color":"#ff7f00"}).text("cancel");
            $.ajax({
                url:'/dress_on',
                type:'post',
                data:{
                    'model_src':modelSrc,
                    'dress_src':dressSrc
                },
                dataType:'json',
                success:function(resp){
                    
                    //일단은 이미지 저장경로 전체로 보내주세요.
                    const src=resp['filename'];
                    const status = resp['status'];
                    if(parseInt(status)===1){
                        alert("다른 옷을 넣어주세요.");
                        $("#dress").css({"background-color":"#81c147"}).text("try-virtual-fitting");
                        $("#main_pic_wrap>img").attr("src",previewsMainImgSrc);
                        return false;
                    }
                    $("#dress").css({"background-color":"#81c147"}).text("try-virtual-fitting");
                    $("#main_pic_wrap>img").attr({"src":src});
                },
                error:function(resp){
                    console.log(resp);
                    $("#main_pic_wrap>img").attr("src",previewsMainImgSrc);
                },
                beforeSend:function(){
                    $("#main_pic_wrap>img").attr({"src":"./static/img/loading.gif"});
                },
                complete:function(){
                }
            })
            
        }
    })


    $("#main_pic_wrap>input").on("change",function(e){
        let file = e.target.files;
        let fileReader = new FileReader();
        let src;
        let file_extension = file[0].name.slice(file[0].name.lastIndexOf('.'),file[0].name.length);
       
     
        const id = $(this).attr("id");
        $("#editImg").attr({"mode":id});
         
        if(file[0].type.match("image/*")){
            fileReader.onload=async function(event){
                src = event.target.result;
                $("body").css({"overflow":"hidden"});
                $("#editImg_con").show();
                
                let canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');
                let imageObj = new Image();

                imageObj.src=src;
                
                imageObj.onload=await function(){}
                canvas.height=imageObj.height;
                canvas.width=imageObj.width;
                
                ctx.fillStyle='#fff';
                ctx.fillRect(0,0,canvas.width,canvas.height);
                ctx.drawImage(imageObj,0,0,canvas.width,canvas.height);
                let newSrc = canvas.toDataURL("image/jpeg");
                /* ctx.drawImage(imageObj,0,0,canvas.width,canvas.height);
                const newSrc = canvas.toDataURL("image/jpeg"); */
                canvasDrawImage(newSrc)
                .then((result,error)=>{
                imgCropDesignate(result);});
                //$("#editImg").attr({"src":src});
            }
            fileReader.readAsDataURL(file[0]);
        }else{return false;}
        $(this).val("");
    })

    $(".arrow").on("click",function(event){
		//right or left
		const thisId = $(this).attr("id");
		// colorBtnListContainer 인지 아닌지 여부
		const thisParentId = $(this).parent().attr("id");
		//console.log(thisParentId);
		
		const $upperElement = $(`#${thisParentId}`);
		
        const $ul = $(this).siblings("ul");
        const len = $(this).siblings("ul").find("li").length;
        if(thisId==='rightArr'||thisId==='rightArr_c'){
            const $lastChild = $ul.children("li")[len-1];
            $upperElement.children('ul').prepend($lastChild)
        }else if(thisId=='leftArr'||thisId==='leftArr_c'){
            const $lastChild = $ul.children("li")[0];
            $upperElement.children('ul').append($lastChild);
        }
	})
