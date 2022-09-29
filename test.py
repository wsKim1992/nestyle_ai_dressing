import numpy as np
import torch
import json
from PIL import Image
import shutil
import subprocess
from torchvision import transforms
import argparse
#import torchgeometry as tgm
import torch.nn as nn
import cv2
import albumentations as albu
import segmentation_models_pytorch as smp

import warnings
warnings.filterwarnings(action='ignore')

import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), "VITON")))
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), "VITON", "background_remove")))

os.environ["CUDA_VISIBLE_DEVICES"] = '0'

from VITON.background_remove.inference import get_model
#from VITON.segmentation import get_sess, body_parsing, make_p_mode
from VITON.networks import SegNet, ALIASGenerator, ClothFlow
from VITON.utils import create_network, load_checkpoint
from VITON.data import get_agnostic, get_im_parse_agnostic
from VITON import opt
from VITON.inference import test

openpose_path = "/home/kevin/programs/openpose/build/examples/openpose/openpose.bin"
openpose_model = "/home/kevin/programs/openpose/models"
pose_path = "./static/img_tmp_pose"
pr_model_path = "./cloth_backtag/best_model.pth"

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

parser = argparse.ArgumentParser()
parser.add_argument('--cloth', type=str, required=True)
parser.add_argument('--model', type=str, required=True)
parser.add_argument('--filename', type=str, required=True)
args = parser.parse_args()


# model_src = '00484_00.jpg'
# cloth_src = '00906_00.jpg'

def to_tensor(x, **kwargs):
    return x.transpose(2, 0, 1).astype('float32')


def dress_on2():
    # 모델 이미지 경로
    model_src=args.model
    # 옷 이미지 경로
    dress_src=args.cloth
    
    #shutil.copy2(model_src, pose_path)

    #pose_err = subprocess.call(f"{openpose_path} --image_dir {pose_path} --hand --disable_blending --display 0 --write_images {pose_path} --write_json {pose_path} --num_gpu 1 --num_gpu_start 0 --model_folder {openpose_model}", shell=True)

    # pose
    model_name = '.'.join(model_src.split('/')[-1].split('.')[:-1])

    pose_map = Image.open(os.path.join(pose_path, model_name + "_rendered.png"))
    pose_map = transforms.Resize(768, interpolation=2)(pose_map)
    pose_map = transform(pose_map)
    

    with open(os.path.join(pose_path, model_name+'_keypoints.json'), 'r') as f:
        pose_label = json.load(f)
        pose_data = pose_label['people'][0]['pose_keypoints_2d']
        pose_data = np.array(pose_data)
        pose_data = pose_data.reshape((-1, 3))[:, :2]

    #for f in os.listdir(pose_path):
    #    os.remove(os.path.join(pose_path, f))

    
    im_parse = Image.open(os.path.join('./static/img_parse', model_name+'.png'))

    im_parse_agnostic = get_im_parse_agnostic(im_parse, pose_data)
    parse_agnostic = torch.from_numpy(np.array(im_parse_agnostic)[None]).long()

    parse_agnostic_map = torch.FloatTensor(20, 1024, 768).zero_()
    parse_agnostic_map.scatter_(0, parse_agnostic, 1.0)
    new_parse_agnostic_map = torch.FloatTensor(13, 1024, 768).zero_()
    for i in range(len(labels)):
        for label in labels[i][1]:
            new_parse_agnostic_map[i] += parse_agnostic_map[label]
    
    # get cloth front mask
    image = cv2.imread(dress_src)
    image = cv2.resize(image, (768,1024), interpolation=cv2.INTER_LINEAR)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    prep_fn = smp.encoders.get_preprocessing_fn('resnet34', 'imagenet')
    prep = albu.Compose([albu.Lambda(image=prep_fn),
                         albu.Lambda(image=to_tensor, mask=to_tensor)])
    x_tensor = torch.from_numpy(prep(image=image)['image']).to('cuda').unsqueeze(0)
    pr_mask = best_model.predict(x_tensor)
    pr_mask = (pr_mask.squeeze().cpu().numpy().round())
    cloth_mask = torch.from_numpy(pr_mask).unsqueeze(0)
    

    # cloth
    cloth_raw = Image.open(dress_src).convert('RGB')
    cloth = Image.new(mode='RGB', size=(768, 1024), color=(220,220,220))
    cloth.paste(cloth_raw, mask=Image.fromarray((pr_mask * 255).astype(np.uint8), mode='L'))
    #cloth.save("./test.png")
    
    # cloth process
    cloth = transforms.Resize(768, interpolation=2)(cloth)
    cloth = transform(cloth)
    
    cloth_raw = transforms.Resize(768, interpolation=2)(cloth_raw)
    cloth_raw = transform(cloth_raw)

    cloth_raw_mask = bg_model.process_image(dress_src, None, bg_post)
    cloth_raw_mask = np.array(cloth_raw_mask)[:,:,3]
    cloth_raw_mask = transforms.Resize(768, interpolation=0)(Image.fromarray(cloth_raw_mask, mode='L'))
    cloth_raw_mask = np.array(cloth_raw_mask)
    cloth_raw_mask = (cloth_raw_mask >= 128).astype(np.float32)
    cloth_raw_mask = torch.from_numpy(cloth_raw_mask).unsqueeze(0)  # [0,1]

    # Get Image agnostic
    im = Image.open(model_src)
    im = transforms.Resize(768, interpolation=2)(im)
    agnostic = get_agnostic(im, im_parse, pose_data)
    im = transform(im)
    agnostic = transform(agnostic)  # [-1,1]

    inputs = {
        'cloth': cloth.unsqueeze(0),
        'cloth_mask': cloth_mask.unsqueeze(0),
        'image': im.unsqueeze(0),
        'agnostic': agnostic.unsqueeze(0),
        'parse_agnostic': new_parse_agnostic_map.unsqueeze(0),
        'pose': pose_map.unsqueeze(0),
        'cloth_raw': cloth_raw.unsqueeze(0),
        'cloth_raw_mask': cloth_raw_mask.unsqueeze(0)
    }
    
    filename = args.filename
    
    err = test(opt, inputs, segnet, clothflow, generator, name=filename, save_dir='./static/img_fitting')  # from VITON.segmentation
    if err:
        raise RuntimeError("IoU Error")
    #print(filename)
    #일단은 생성된 이미지 전체 경로를 보내주세요.
    #ex) ./static/img/filename.png



if __name__ == '__main__' :
    # model load
    bg_model, bg_post = get_model()
    #sess, fn, pred_all = get_sess()

    segnet = SegNet(in_ch=21, out_ch=13)
    #gmm_model = GMM(opt, input_ch=7, cloth_ch=3)
    clothflow = ClothFlow(input1_nc=4, input2_nc=1, ngf=64, norm_layer=nn.BatchNorm2d)
    opt.semantic_nc = 7
    generator = create_network(ALIASGenerator, opt)
    load_checkpoint(segnet, opt.segnet_checkpoint)
    load_checkpoint(clothflow, opt.clothflow_checkpoint)
    load_checkpoint(generator, opt.gen_checkpoint)
    
    best_model = torch.load(pr_model_path)
    
    dress_on2()
    
    print("Complete")
    
    