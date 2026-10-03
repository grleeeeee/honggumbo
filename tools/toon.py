import cv2, numpy as np
def toon(src, dst):
    img = cv2.imread(src)
    c = img
    for _ in range(4): c = cv2.bilateralFilter(c, 9, 50, 9)
    Z = c.reshape(-1, 3).astype(np.float32)
    _, lab, cen = cv2.kmeans(Z, 20, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 1.0), 2, cv2.KMEANS_PP_CENTERS)
    q = cv2.medianBlur(cen[lab.flatten()].reshape(img.shape).astype(np.uint8), 7)
    hsv = cv2.cvtColor(q, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.3, 0, 255); hsv[..., 2] = np.clip(hsv[..., 2] * 1.08, 0, 255)
    q = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    g = cv2.GaussianBlur(cv2.cvtColor(c, cv2.COLOR_BGR2GRAY), (5, 5), 0)
    e = cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11, 6)
    ink = (e == 0).astype(np.uint8)
    n, lbl, st, _ = cv2.connectedComponentsWithStats(ink, connectivity=8)
    keep = np.zeros_like(ink)
    for k in range(1, n):
        if st[k, cv2.CC_STAT_AREA] >= 45: keep[lbl == k] = 1   # 벽 질감 같은 작은 얼룩 제거
    keep = cv2.dilate(keep, np.ones((2, 2), np.uint8))
    out = q.copy(); out[keep == 1] = (20, 20, 20)
    cv2.imwrite(dst, out, [cv2.IMWRITE_JPEG_QUALITY, 80])
for i in range(1, 5): toon(f'/tmp/orig/{i}.jpg', f'img/{i}.jpg')
