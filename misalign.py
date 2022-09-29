import cv2
import os
from PIL import Image
from argparse import ArgumentParser

parser = ArgumentParser()
parser.add_argument('--test_name', type=str, default='test')
args = parser.parse_args()

ls = os.listdir("cloth_mask")
ls.sort()

f = open(f"{args.test_name}.txt", 'w')

for file in ls:
    warped_cm = cv2.imread(os.path.join("cloth_mask", file))[:, :, 0] / 255
    misalign_mask = cv2.imread(os.path.join("misalign", file))[:, :, 0] / 255

    iou = misalign_mask.sum() / (misalign_mask.sum() + warped_cm.sum())
    iou *= 100
    iou = f"{iou:0.4}"

    f.writelines(file.split('.')[0]+' : '+iou+'\n')
        
f.close()