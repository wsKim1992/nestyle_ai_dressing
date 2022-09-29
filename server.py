from flask import Flask, request, render_template
import numpy as np
import cv2
import datetime
from PIL import Image
import shutil
import subprocess
from torchvision import transforms

#from networks import get_network
#import torchvision.transforms as std_trnsf

import warnings
warnings.filterwarnings(action='ignore')

import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), "VITON")))
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), "VITON", "background_remove")))

os.environ["CUDA_VISIBLE_DEVICES"] = '1'

from VITON.background_remove.inference import get_model
from VITON.segmentation import get_sess, body_parsing, make_p_mode, body_parsing_with_gaussian
from VITON.networks import SegNet, ALIASGenerator
from VITON.utils import create_network, load_checkpoint
from VITON.data import get_agnostic, get_im_parse_agnostic
from VITON import opt
from VITON.inference import test

app = Flask(__name__)

# Global models

pose_path = "./static/img_tmp_pose"
openpose_path = "/home/kevin/programs/openpose/build/examples/openpose/openpose.bin"
openpose_model = "/home/kevin/programs/openpose/models"

transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])
labels = {
    0: ['background', [0, 10]],
    1: ['hair', [1, 2]],
    2: ['face', [4, 13]],
    3: ['upper', [5, 6, 7]],
    4: ['bottom', [9, 12]],
    5: ['left_arm', [14]],
    6: ['right_arm', [15]],
    7: ['left_leg', [16]],
    8: ['right_leg', [17]],
    9: ['left_shoe', [18]],
    10: ['right_shoe', [19]],
    11: ['socks', [8]],
    12: ['noise', [3, 11]]
}


@app.route('/')
def index() :
    return render_template('dress_fitting.html')


@app.route('/dress_on',methods=['POST'])
def dress_on():
    #
    model_src=request.form['model_src']
    #옷 이미지 경로
    dress_src=request.form['dress_src']
    
    filename = datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f') + ".jpg"
    if not os.path.isfile(os.path.join('./static/img_parse', model_src.split("/")[-1].split('.')[0]+'.png')):
        body_parsing_with_gaussian(model_src)
    
    # openpose
    #shutil.copy2(model_src, pose_path)
    #pose_err = subprocess.call(f"{openpose_path} --image_dir {pose_path} --hand --disable_blending --display 0 --write_images {pose_path} --write_json {pose_path} --num_gpu 1 --num_gpu_start 0 --model_folder {openpose_model}", shell=True)
    
    err = subprocess.call(f"/home/kevin/anaconda3/envs/VITON_CF/bin/python test.py --cloth {dress_src} --model {model_src} --filename {filename}", shell=True)
    # err -> 1: error
    
    if err:
        return {'filename': '',
                'status': 1}
    
    #일단은 생성된 이미지 전체 경로를 보내주세요.
    #ex) ./static/img/filename.png
    return {'filename':os.path.join('./static/img_fitting', filename),
            'status': 0}


# 옷/모델 사진 올리는 코드 입니다.
@app.route('/upload_dress_img',methods=['POST'])
def upload_dress_img():
    print('dress 이미지 업로드')
    
    img_data=request.files.get('img_upload')
    upload_type = request.form['upload_type']
    upload_time = datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    print(upload_type)
    dir_path='./static/'
    if upload_type=='modelPic':
        dir_path=dir_path+'img_model/'
    elif upload_type=='dressPic':
        dir_path=dir_path+'img_dress/'
    print(dir_path)
    img_data.save(dir_path+upload_time+'.jpeg')
    img_data=cv2.imread(dir_path+upload_time+'.jpeg', cv2.IMREAD_COLOR)
    img_data=cv2.resize(img_data,(768,1024), interpolation=cv2.INTER_NEAREST)
    cv2.imwrite(dir_path+upload_time+'.jpeg', img_data)   
    
    return upload_time


#dress_fitting.html 파일 전송해주는 코드입니다.    
@app.route('/dress_fitting')
def dress_fitting():
    return render_template('dress_fitting.html')


if __name__ == '__main__' :
    #app.run(host='localhost', port=5020, debug=True)
    app.run(host='0.0.0.0', port=8282, debug=False)
    