let fileName;
let respImgArr;
let respImgArrByte;
let upload_time;
let timer;
let flag = false;
let jcropApi = null;
let originCanvas=null;
let originCanvasURL=null;
let lastWindowWidth;
let lastWindowHeight;
let seg_data;
//이미지 다운받아서 로컬 스토리지에 저장...
	$("#test").on("click",function(e){
		let arr = new Array(1,2,3,4);
		console.log(arr);
		$.ajax({
			url:"/get_3d_array",
			type:"post",
			success:function(resp){
				console.log(resp);
				console.log(resp['data']);
				console.log(resp['data'].length);
				const file = new Blob([new Uint8Array(resp['data'])],{'type':'image/png'});
				console.log(file);
				let reader = new FileReader();
				reader.onload = function(event){
					let base64=event.target.result;
					console.log(base64);
				}
				reader.readAsDataURL(file);
			},
			error:function(){
				alert("에러");
			}
		})
	})
	$(window).on("resize",function(){
		let width = parseFloat(window.innerWidth);
		let height = parseFloat(window.innerHeight);
		let flag=false;
		/* console.log("window_width : "+width);
		console.log("window_height : "+height);
		 */
		if(window.innerWidth>800){
			$("#jcropImg").css({"width":screen.width,"height":screen.height});
			if(lastWindowWidth<=800){flag=true;}

		}else if(window.innerWidth<=800){
			$("#jcropImg").css({"width":window.innerWidth,"height":window.innerHeight});
			if(lastWindowWidth>800){flag=true;}
		}
		if(flag==true){
			if(jcropApi!=null){
				jcropApi.destroy();
				jcropApi=null;
			}
			
			let src = $("#editImg").attr("src");
			console.log(src);

			canvasDrawImage(src,function(){},false)
			.then((result,reject)=>{imgCropDesignate(result)});
		}
		lastWindowWidth=width;
		lastWindowHeight=height;

	})

    $("#jcropImg .resize_btn").on("click",function(){
        const id = $(this).attr("id");
        let xAxis =parseFloat($("#xAxis").val());
        let yAxis = parseFloat($("#yAxis").val());
        let wLength=parseFloat($("#wLength").val());
        let hLength=parseFloat($("#hLength").val());
        console.log(xAxis);console.log(yAxis);
        let newHLength;let newWLength; let x1Offset;let y1Offset;
        if(id=='plusBtn'){
            newHLength = hLength*1.25;
        }else if(id=='minusBtn'){
            newHLength = hLength*0.8;
        }
        if(newHLength>=512){newHLength=512;}
        newWLength = newHLength;
        x1Offset = (wLength-newWLength)/2;
        y1Offset = (hLength-newHLength)/2;
        //console.log("nH : "+newHLength+" nW : "+newWLength+" x1Off : "+x1Offset +" y1Off : "+y1Offset);

        let newX1=xAxis+x1Offset;
        let newY1=yAxis+y1Offset;
        let newX2= xAxis+newWLength;
        let newY2=yAxis+newHLength;
        //console.log("x1 : "+newX1+" y1 : "+newY1+" x2 : "+newX2 +" y2 : "+newY2);

        $("#editImg").Jcrop({
            bgFade:true,
            bgOpacity:0.5,
            aspectRatio:1,
            allowResize:true,
            onSelect:uploadCoords,
            setSelect:[newX1,newY1,newX2,newY2]
        });
    })

	$("#jcropImg .fa-undo-alt").on("click",function(e){
		jcropApi.destroy();
		jcropApi=null;
		$("#jcropImg").hide();
	})
	//캔버스 이미지를 저장 후 서버에 전송하는 기능
	function saveAndSendCanvas(canvas){
		//Canvas 이미지를 데이터로 저장
		//저장된 Canvas 이미지를 base64에서 디코딩
		//디코딩된 값을 바이트 배열로 변환 후 저장
		//typed array인 8bit unsigned array로 변환
		//new blob 생성자를 사용해 blob값으로 변환
		//FormData 생성자를 사용해 이미지 값을 서버의 데이터로 저장
		//ajax의 post 메소드를 사용하여 서버에 전송
		//console.log(canvas.toDataURL("image/png"));
		let dataURI = canvas.toDataURL("image/png",'octet-stream');
		console.log(dataURI);
		const decodImg = atob(dataURI.split(',')[1]);
		console.log(decodImg);
		let array=[];
		console.log("decode Img len : "+decodImg.length);
		for(let i =0;i<decodImg.length;i++){
			array.push(decodImg.charCodeAt(i));
		}
		console.log(array);
		const file = new Blob([new Uint8Array(array)],{'type':'image/png'});
		const fileName = 'canvas_img_'+new Date()+'.png';
		let formData = new FormData();
		formData.append('img_upload',file,fileName);
		$("#jcropImg").hide();
		$.ajax({
			url:"/upload_img",
			type:'post',
			cache:false,
			data:formData,
			processData:false,//data 파라미터 강제 string 변환 방지!
			contentType:false,// application/x-www-form-urlencoded; 방지 
			//즉, url에 data가 인코딩되는 것을 방지한다...
			success:function(resp){
				upload_time = resp['upload_time'];
				let today = new Date();
				const dirPath = "./static/"+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+'-upload/';
				const src = dirPath.toString()+upload_time+'.png';
				console.log(src);
				const length = parseInt(resp['seg_data_to_list'].length);
				seg_data = Array.from(Array(parseInt(length)),()=>new Array(parseInt(length)));
				seg_data=resp['seg_data_to_list'];
				console.log(seg_data);
				/* console.log(seg_data[0][0]);
				console.log(seg_data.length); */
				$("#editImg").attr({"src":""}).css({width:"700px",height:"700px"});
				//$("#colorList label").bind("click");
				if($("#DyedImg").attr("imgType")=='sample'){
					$("#imgBox>.fa-upload").hide();
					$("#imgBox>.fa-times-circle").show();
				}
				$("#imgContainer #imgBox #DyedImg").attr({"src": src,"imgType":"uploaded"}).show();
				//$("#originImgBox #originImg").attr({"src": src,"imgType":"uploaded"}).show();
				const lis=$("#imgBtnList>li");
				const liNum = $("#imgBtnList>li").length;
				
				$("#imgBtnList>li>img").removeClass("on");
				$("#downLink").attr({"href":src});
				if(liNum<=6){
					let $li = lis.eq(0).clone(true);
					$li.children('img').attr({"src":src});
					$("#imgBtnList").append($li);
					//alert($li.children('img').attr("src"));
				}else{
					$("#imgBtnList>li").eq(6).find("img").attr({"src":src});
				}
			},
			error:function(resp){
				//alert("실패");console.log(resp);
			},
			beforeSend:function(){
				$("#loadDyedImg").attr("src","/static/img/loading.gif").show();
				$("#DyedImg").hide();
			},
			complete:function(){
				$("#loadDyedImg").hide();
			}
		})
	}

	//캔버스 이미지 생성
	//upload 한 이미지를 canvas 에다 그려주기!!
	function canvasDrawImage(src,callback,mode){
        return new Promise(function(resolve,reject){
            let dataURI;
		    let preImage = new Image();
            let widthAndHeight=null;
			//$("#editImg").attr({"src":src});
			//console.log(src);
			let top,left;
			let imgWrapWidth = $("#imgWrap").css("width");
			let imgWrapHeight = $("#imgWrap").css("height");
			imgWrapWidth=parseInt(imgWrapWidth.slice(0,imgWrapWidth.indexOf("px")));
			imgWrapHeight=parseInt(imgWrapHeight.slice(0,imgWrapHeight.indexOf("px")));
		
			console.log(imgWrapWidth);console.log(imgWrapHeight);
            preImage.src=src;
            let originCanvasContext;
            preImage.onload = function(){
                let canvas = document.createElement('canvas');
                let canvasContext = canvas.getContext('2d');
				//원본 이미지를 삽입하는 canvas
				if(mode==true){
					originCanvas = document.createElement('canvas');
					originCanvasContext = originCanvas.getContext('2d');
				}
                let width;let height;
                if(preImage.width>=preImage.height){
					if(imgWrapWidth==700){width=700;}
                    else if(imgWrapWidth==300){width=300;}
                    height=parseFloat(preImage.height/preImage.width)*width;
                    top=(width-height)/2;left=0;
                }else{
					if(imgWrapHeight==700){height=700;}
					else if(imgWrapHeight==300){height=300;}
                    width=parseFloat(preImage.width/preImage.height)*height;
                    top=0;left=(height-width)/2;
                }
                //console.log(preImage.height);
                //console.log(preImage.width);
                canvas.width = width;
				canvas.height= height;
				if(mode==true){
					originCanvas.width=preImage.width;
					originCanvas.height=preImage.height;
					originCanvasContext.drawImage(preImage,0,0,originCanvas.width,originCanvas.height);
					originCanvasURL=originCanvas.toDataURL("image/jpeg");
                }//console.log("canvas Width : "+canvas.width);
                //console.log("canvas Height : "+canvas.height);
                
                canvasContext.drawImage(preImage,0,0,width,height);
                
                //canvas의 이미지를 uri(base64)로 인코딩된 형태로 변환...
                dataURI = canvas.toDataURL("image/jpeg");
                //console.log(dataURI);
                $("#editImg").css({"width":width+"px","height":height+"px"})
                .attr({"src":dataURI});

                widthAndHeight={width:width,height:height};	
                resolve(widthAndHeight);
            }
        });
	}
	
	//이미지 크롭 영역지정 ui 나타내기
	function imgCropDesignate(result){
        console.log("result width: "+result.width);
        console.log("result height: "+result.height);
        let width = result.width;
        let height = result.height;
        
		let edWidth = parseFloat(width);
		let edHeight = parseFloat(height);
		console.log("editImg Width : "+edWidth);
		console.log("editImg Height : "+edHeight);
		let length = Math.min(edWidth,edHeight);
		
		let margin;let x;let y;
		if(length == edWidth){
			x=0; diff = (edHeight-length)/2;
			y=diff; 
		}else{
			y=0; diff = (edWidth-length)/2; 
			x=diff; 
		}
		console.log("length : "+length);
		console.log("diff : "+diff);
		let x1 = x;
		let y1 = y;
		let y2=y+length;
		let x2=x+length;

		$("#editImg").Jcrop({
			bgFade:true,
			bgOpacity : 0.5,
			allowResize:false,
			setSelect : [x1,y1,x2,y2],
			aspectRatio:1,
			//x1 y1: 시작좌표
			//x2 y2 : 끝좌표
			onSelect : uploadCoords,},
			function(){
				jcropApi=this;
		})
		$(".jcrop-dragbar").off("click");
        $(".ord-s").off("click");
        $(".ord-e").off("click");
        $(".ord-w").off("click");
        $(".ord-n").off("click");
	}
	//지정된 크롭 한 영역 의 값을 보관하는 함수
	//parameter로 Jcrop에 설정한 시작 좌표와 높히 너비값이
	//넘겨짐..
	function uploadCoords(crap){
		console.log(crap.x);
		console.log(crap.y);
		console.log(crap.w);
		console.log(crap.h);
		$("#xAxis").val(crap.x);
		$("#yAxis").val(crap.y);
		$("#wLength").val(crap.w);
		$("#hLength").val(crap.h);
	}
	//지정된 크롭 한 영역 의 값을 보관하는 함수 
	function imgCropApply(){
		//console.log("jcropApi");
		//console.log(jcropApi);
		if(parseInt($("#wLength").val())=="NaN"){
			//alert("이미지를 크롭한 이후 \n 자르기 버튼을 클릭하세요");
			return false;
		}else{
			let img = new Image();
            img.src = originCanvasURL;
            //$("#editImg").attr("src");
            let xAxis = parseFloat($("#xAxis").val());let yAxis = parseFloat($("#yAxis").val());
            let wLength = parseFloat($("#wLength").val());let hLength = parseFloat($("#hLength").val());
            let x2Axis = xAxis+wLength;let y2Axis = yAxis+hLength;

            let editImgWidth=parseFloat($("#editImg").css("width"));
			let editImgHeight=parseFloat($("#editImg").css("height"));
			
			console.log(originCanvas.width);console.log(originCanvas.height);
			console.log(editImgWidth);console.log(editImgHeight);
            
            img.onload=function(){
				let canvas=document.createElement('canvas');
				let canvasContext=canvas.getContext("2d");
				console.log("img width : "+img.width);
				console.log("img height : "+img.height);	
                let newXAxis = parseFloat(xAxis/editImgWidth)*parseInt(originCanvas.width);
                let newYAxis = parseFloat(yAxis/editImgHeight)*parseInt(originCanvas.height);
                let newX2Axis = parseFloat(x2Axis/editImgWidth)*parseInt(originCanvas.width);
                let newY2Axis = parseFloat(y2Axis/editImgHeight)*parseInt(originCanvas.height); 
                let newWidth = newX2Axis-newXAxis;let newHeight=newY2Axis-newYAxis;
				
				console.log("newXAxis : "+newXAxis);console.log("newYAxis : "+newYAxis);
				console.log("newX2Axis : "+newX2Axis);console.log("newY2Axis : "+newY2Axis);
				console.log("newWidth : "+newWidth)

				canvas.width=newWidth;
				canvas.height=newWidth;
				console.log("canvas width : "+canvas.width);
				console.log("canvas height : "+canvas.height);
				canvasContext.drawImage(
					this,
					newXAxis,//자르기를 시작할 x좌표
					newYAxis,//자르기를 시작할 y좌표
					newWidth,//잘라낸 이미지의 넓이
					newHeight,//잘라낸 이미지의 높이
					0,//캔버스에 이미지를 배치할 x 좌표
					0,//캔버스에 이미지를 배치할 y 좌표
					newWidth,//사용할 이미지의 넓이 
					newHeight//사용할 이미지의 높이
				);
				
				let dataURI = canvas.toDataURL("image/jpeg");
				$("#editImg").attr({"src":dataURI});
				$("#editImg").css({"width":canvas.width,"height":canvas.width});
                saveAndSendCanvas(canvas);
                originCanvas=null;
			}
            //jcropApi 객체 메모리 해제...
			jcropApi.destroy();
			jcropApi=null;
		}
	}
	/* $("#editBtn").on("click",function(){
		imgCropDesignate();
	})
	$("#cutBtn").on("click",function(){
		impCropApply();
	}); */


	//이미지 절반 나누기&슬라이드
	$("#imgBox>.fa-star-half-alt").on("click",function(){
		const displayMode = $("#imgBox").attr("display_mode");
		const dyedSrc = $("#imgBox>#DyedImg").attr("src");
		const originSrc = $("#originImg").attr("src");
		
		console.log(dyedSrc);console.log(originSrc);
		if(displayMode=='full'){
			$("#imgBox #slideBar").show().css({"left":210+"px","margin-left":"-1px"});
			$("#imgBox #slideImg").show();
			$("#imgBox #slideImg>img").attr({"src":dyedSrc});
			$("#imgBox #DyedImg").attr({"src":originSrc});
			$("#imgBox").attr({"display_mode":"half"});
		}else{
			$("#imgBox #slideBar").hide();
			$("#imgBox #slideImg").hide();
			$("#imgBox").attr({"display_mode":"full"});
			$("#imgBox #DyedImg").attr({"src":dyedSrc});
		}
	})
	$("#slideImg>img").on("click",function(){
		console.log("slideImg");
	});
	//슬라이드 동작코드
	$("#imgBox #slideBar").on("mousedown",function(e){
		//클릭이벤트 버블링(다른 요소들까지 event 가 전파)되는걸 방지...
		e.stopPropagation();
		/* console.log("this nodeName : "+this.nodeName);
		console.log("e.target.nodeName : "+e.target.nodeName);
		console.log("event phase : "+e.eventPhase); */
		
		let imgBoxOffsetLeft = $("#imgBox").offset().left;
		let slideBarOffsetLeft = $(this).offset().left;
		let interval = slideBarOffsetLeft - imgBoxOffsetLeft;
		let x = e.clientX-interval;
		$(this).on("mousemove",function(event1){
			let width = $("#imgBox").css("width");
			width = width.substring(0,width.indexOf("px"));
			let newX = event1.clientX-x;
			if(newX>=width){e.preventDefault();return false;}
			newX = ((newX/width)*100).toPrecision(7);
			newX +="%";
			
			$(this).css({"left":newX});
			$("#slideImg").css({"width":newX});
			$(this).on("mouseleave",function(){
				$(document).off("mousemove");
				$("#imgBox #slideBar").off("mousemove");
			}) 
			$(this).on("mouseup",function(){
				$(document).off("mousedown");
				$("#imgBox #slideBar").off("mousemove");
			})  
		})
	})

	$("#imgUploadBtn .fa-times-circle").on("click",function(e){
		$(this).parent().hide();
	})
	//향후 받는 모든 ajax 비동기 통신에 cache를 거부
	//$.ajaxSetup({cache:false});

	$("#imgBtnList>li>img").on("click",function(event){
		$("#imgBtnList>li>img").removeClass("on");
		const id = $("#colorListContainer>.on").attr("for");
		let h_value = $(id).val();
		let src=$(this).attr("src");
		//alert(src);
		$("#colorListContainer label").removeClass("on");
		$("#imgContainer>#imgBox>img").attr("src",src);
		const imgType = $("#DyedImg").attr("imgType");
		if(imgType=='sample'||$(this).parent().index()==6){
			if($(this).parent().index()==6){
				$("#DyedImg").attr({"imgType":'upload'});
			}
			$("#DyedImg").attr({"src":src});	
		}
		else{
			if($(this).parent().index()!=6){
				$("#DyedImg").attr({"src":src,"imgType":"sample"});
				$("#imgBox>.fa-times-circle").hide();
				$("#imgBox>.fa-upload").show();
			}
		}
		$(this).addClass("on");
	}) 
	//파일올리는 
	$("#imgUploadBtn>#imgFile").on("change",function(event){
		//timer = setInterval(function(){console.log(flag);flag=true;},1000);
		let file = event.target.files;
		let fileReader = new FileReader();
			
		if(file[0].type.match("image/*")){
			let imgData;
			let src;
			fileReader.onload = function(e){
				src = e.target.result; 
				if(parseFloat(window.innerWidth)>800){
					$("#jcropImg").css({"width":screen.width,"height":screen.height}).show();
				}else{
					$("#jcropImg").css({"width":window.innerWidth,"height":window.innerHeight}).show();
				}
				
                canvasDrawImage(src,function(){},true)
                .then((result,error)=>{
                    console.log("result width: "+result.width);
                    console.log("result height: "+result.height);
                    imgCropDesignate(result);
                })
			} 
			fileReader.readAsDataURL(file[0]);
			/* let formData = new FormData();
			formData.append('img_upload',file[0],file[0].name);	 */
			$("#colorListContainer label").removeClass("on");
			
			$("#checkBox").prop({"checked":false});
			$("#imgUploadBtn").css({"display":"none"});
			$("#colorList label").removeClass("on");
			$(this).val("");
		}
	})

	$("#cutBtn").on("click",function(event){
		imgCropApply();
	})

	$("#colorThicknessSelectWrap>div>label").on("click",function(e){
		const imgType = $("#originImg").attr("imgType");
		let src = $("#imgContainer>#imgBox>#DyedImg").attr("src");
		if(imgType=='sample'){
			if(src==undefined||src==null){e.preventDefault();//alert("사진을 올려주세요 ^오^");
			return false;}
			const originImgSrc = $("#originImg").attr("src");
			colorNum=$("#"+$("#colorListContainer .on").attr("for")).val();
			thickNum=$("#"+$(this).attr("for")).val();
			//alert(colorNum);alert(thickNum);
			const newSrc=originImgSrc.slice(0,originImgSrc.lastIndexOf("."))+"-"+colorNum+"-"+thickNum+".png";
			$("#imgContainer>#imgBox>#DyedImg").attr({"src":newSrc});
		}
		else{
			const id = $(this).attr("for"); 
			const val=$("#"+id).val();
			//alert(val);
			if(src==undefined||src==null){
				e.preventDefault();
				//alert("사진을 올려주세요 ^오^");
				return false;
			}
			//alert(src);
			let idx = src.lastIndexOf("-");
			let quoteIdx = src.lastIndexOf("?");
			//alert(quoteIdx);
			let newSrc;
			if(quoteIdx!=-1){
				newSrc= src.slice(0,idx+1)+val+src.slice(idx+2,quoteIdx);
			}else{newSrc=src.slice(0,idx+1)+val+src.slice(idx+2);}
			//alert(newSrc);
			//alert(newSrc);
			$("#imgContainer>#imgBox>#DyedImg").attr({"src":newSrc+"?"+Date.now()});
		}
	})
	//이미지 파일의 rgb 값을 base64 로 인코딩 해주기 위한 메서드
	convertBase64 = function(realArr){
		//realArr 은 str 형 배열이므로
		//charCodeAt 메서드를 사용하기 위해선 하나의 Str로 합쳐야함
		realArrToString=realArr.toString();
		let bytes=[];
		//우선 먼저 byte 화 해준다
		for(let i=0;i<realArr.length;i++){
			//realArr의 각 문자를 unicode로 바꿔줌
			bytes[i]=realArrToString.charCodeAt(i)&0xff;
		}

		console.log(bytes);
		//유니코드로 바뀐 애들을 charactor 로 바꿔준다.
		charactors = String.fromCharCode.apply(String,bytes);
		realArrBase64 =  btoa(charactors);
		
		return bytes;
	}

	$("#imgBox>i").on("click",function(){
		const className = this.getAttribute("class").substring(4);
 		//alert(className);
		const displayMode = $("#imgBox").attr("display_mode");
		if(displayMode=="half"){
			$("#imgBox").attr({"display_mode":"full"});
			$("#slideBar").css({"display":"none"});
			$("#slideImg").css({"display":"none"});
		}
		$("#imgUploadBtn").css({"display":"block"});
	})
	$("#imgUploadBtn>label").on("click",function(e){
		//alert("");
		const isChecked = $("#checkBox").prop("checked");
		if(!isChecked){e.preventDefault();return;}
	})

	function createObjectURL(file){
		if(window.webkitURL){
			console.log("webkitURL : "+  window.webkitURL);
			return window.webkitURL.createObjectURL(file);
		}else if(window.URL && window.URL.createObjectURL){
			console.log("window.URL : "+window.URL.createObjectURL);
			return window.URL.createObjectURL(file);
		}else{
			return null;
		}
	}

	$("#colorList #colorListContainer label").on("click",function(e){
		let imgType = $("#DyedImg").attr("imgType");
		$("#colorList label").removeClass("on");
		$(this).addClass("on");
		let src = $(this).children('img').attr("src");
			//alert(src);
			// $("#imgContainer>#imgBox>img").attr({"src":src});
			const h_value = $("#"+$(this).attr("for")).val();
		if(imgType=='sample'){
			const selectedImgSrc= $("#imgBtnList .on").attr("src");
			
			let colorNum=-1;let thickNum=0;
			if(h_value=='0'){colorNum=0;}
			else if(h_value=='1'){colorNum=1;}
			else if(h_value=='2'){colorNum=2;}
			else if(h_value=='3'){colorNum=3;}
			else if(h_value=='4'){colorNum=4;}
			else if(h_value=='5'){colorNum=5;}
			else {colorNum=6;}
			let pointIdx = selectedImgSrc.indexOf(".");
			/* 
			let slashIdx=selectedImgSrc.lastIndexOf("/");
			let pointIdx = selectedImgSrc.indexOf(".");
			const imgName = selectedImgSrc.slice(slashIdx+1,pointIdx);
			 */
			const newSrc = selectedImgSrc.slice(0,pointIdx)+"-"+colorNum+"-0.png";
			//alert(newSrc);
			$("#downLink").attr({"href":newSrc});
			$("#DyedImg").attr("src",newSrc);
			return false;
		}else{
			if(flag==true){//alert("이미 염색이 진행중입니다!");
			return false;}
			else{
				//console.log(flag);
				//console.log(seg_data);
				flag=true;
				//ajax에 배열을 넘기기 위해..
				const length = seg_data.length;
				$.ajax({
					url:"/hair_dyeing?"+Math.random(),
					type:'post',
					traditional:true,
						//cache:false,
					data: {
						'upload_time' : upload_time,
						'color_idx' : h_value,
						'seg_data' : seg_data,
						'seg_data_length' : length
					},
					error:function(resp){
						console.log(resp);
						//alert("fail");
					},
					success:function(resp){
						console.log(resp['filename']);
						/* let src ='data:image/png;base64,';
						let base64 = btoa(resp['img_hair_dyeing']);
						src=src+base64;
						
						//$("#DyedImg").show().attr({'src':blobUrl});
						/* $("#DyedImg").show().attr({"src":url}); */
						//alert("염색완료");
						let todayDate = new Date();
						let dirPath = './static/'+todayDate.getFullYear()+'-'+(todayDate.getMonth()+1)+'-'+todayDate.getDate()+'-upload_dyed_img';
						const src = dirPath+'/' + resp['filename'] +"-0"+ '.png?'+Date.now();
						console.log(src);
						$("#DyedImg").show().attr({"src":src});
						$("#downLink").attr({"href":src});
					},
					beforeSend:function(){
						$("#loadDyedImg").attr("src","/static/img/loading.gif");
						$("#loadDyedImg").show();
						$("#DyedImg").hide();
					},
					complete:function(){
						console.log($("#loadDyedImg").attr("src"));
						$("#loadDyedImg").hide();
						//$("#DyedImg").show();
						flag=false;
						//alert(flag);
					}
				});
			}
		}
	})
	$(".arrow").on("click",function(event){
		const thisId=$(this).attr("id");
		let left=$("#imgBtnList").css("left");
		left=parseInt(left);
		 
		console.log(thisId.length);
		if(thisId.length=="8"){
			if(thisId=="rightArr"){
				if(left<-425){left=0;}
				else{left-=85;}
			}else if(thisId=="leftArr"){
				if(left!=0){left+=85;}	
			}
			$("#imgBtnList").css({"left":left+"px"});
		}else if(thisId.length=="11"){
			if(thisId=="rightArrCol"){
				if(left<=-560){left=0;}
				else{left-=80;}
			}else{
				if(left!=0){left+=80;}
			}
			$("#colorList").css({"left":left+"px"});
		}
	})