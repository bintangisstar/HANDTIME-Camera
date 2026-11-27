type PhotoSlot = [[number, number], [number, number], [number, number], [number, number]];

export type BoothTemplate = {
  id: string;
  name: string;
  image: string;
  slots: PhotoSlot[];
  /** Extra decorative opening filled with an existing shot, not another capture. */
  duplicateSlots?: Array<{ slot: PhotoSlot; photoIndex: number }>;
};

const rectangle = (left: number, top: number, right: number, bottom: number): PhotoSlot => [
  [left, top],
  [right, top],
  [right, bottom],
  [left, bottom],
];

// Slot bounds follow the transparent openings in the supplied PNGs.
export const BOOTH_TEMPLATES: BoothTemplate[] = [
  {
    id: "Tmp1_isi3",
    name: "Blue Memories",
    image: "./templates/Tmp1_isi3.png",
    slots: [
      rectangle(0.3167, 0.3289, 0.6694, 0.5203),
      rectangle(0.3167, 0.5242, 0.6806, 0.7227),
      rectangle(0.3194, 0.743, 0.6833, 0.9383),
    ],
  },
  {
    id: "Tmp2_isi4",
    name: "Little Things",
    image: "./templates/Tmp2_isi4.png",
    slots: [
      rectangle(0.0653, 0.0215, 0.4319, 0.2458),
      rectangle(0.0653, 0.257, 0.4319, 0.4738),
      rectangle(0.0653, 0.485, 0.4319, 0.7065),
      rectangle(0.0653, 0.7187, 0.4319, 0.9757),
    ],
    // The phone-screen opening is decorative; echo the first shot there.
    duplicateSlots: [
      { slot: rectangle(0.6181, 0.3551, 0.9222, 0.5533), photoIndex: 0 },
    ],
  },
  {
    id: "Tmp3_isi3",
    name: "Snoopy Day",
    image: "./templates/Tmp3_isi3.png",
    slots: [
      [
        [0.527, 0.027],
        [0.938, 0.057],
        [0.892, 0.271],
        [0.505, 0.239],
      ],
      [
        [0.31, 0.38],
        [0.634, 0.388],
        [0.628, 0.56],
        [0.302, 0.548],
      ],
      [
        [0.557, 0.708],
        [0.859, 0.676],
        [0.913, 0.851],
        [0.612, 0.889],
      ],
    ],
  },
  {
    id: "Tmp4_isi3",
    name: "Vanilla Creamy",
    image: "./templates/Tmp4_isi3.png",
    slots: [
      rectangle(0.13, 0.11, 0.875, 0.325),
      rectangle(0.13, 0.357, 0.875, 0.618),
      rectangle(0.13, 0.641, 0.875, 0.886),
    ],
  },
];

export function getBoothTemplate(id: string) {
  return BOOTH_TEMPLATES.find((template) => template.id === id) ?? BOOTH_TEMPLATES[0];
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Gagal memuat gambar: ${src}`));
    image.src = src;
  });
}

function drawCoverInSlot(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  slot: PhotoSlot,
  width: number,
  height: number
) {
  const points = slot.map(([x, y]) => [x * width, y * height] as const);
  const [topLeft, topRight, bottomRight, bottomLeft] = points;
  const slotWidth = Math.hypot(topRight[0] - topLeft[0], topRight[1] - topLeft[1]);
  const slotHeight = Math.hypot(bottomLeft[0] - topLeft[0], bottomLeft[1] - topLeft[1]);
  const scale = Math.max(slotWidth / image.width, slotHeight / image.height);
  const sourceWidth = slotWidth / scale;
  const sourceHeight = slotHeight / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...topLeft);
  ctx.lineTo(...topRight);
  ctx.lineTo(...bottomRight);
  ctx.lineTo(...bottomLeft);
  ctx.closePath();
  ctx.clip();

  const horizontalX = (topRight[0] - topLeft[0]) / slotWidth;
  const horizontalY = (topRight[1] - topLeft[1]) / slotWidth;
  const verticalX = (bottomLeft[0] - topLeft[0]) / slotHeight;
  const verticalY = (bottomLeft[1] - topLeft[1]) / slotHeight;
  ctx.transform(horizontalX, horizontalY, verticalX, verticalY, topLeft[0], topLeft[1]);
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, slotWidth, slotHeight);
  ctx.restore();
}

export async function composeBoothImage(templateId: string, photos: string[]) {
  const template = getBoothTemplate(templateId);
  if (photos.length !== template.slots.length) {
    throw new Error("Jumlah foto tidak cocok dengan template.");
  }

  const [templateImage, ...photoImages] = await Promise.all([
    loadImage(template.image),
    ...photos.map(loadImage),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = templateImage.naturalWidth;
  canvas.height = templateImage.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tidak bisa membuat gambar photobooth.");

  photoImages.forEach((photo, index) => {
    drawCoverInSlot(ctx, photo, template.slots[index], canvas.width, canvas.height);
  });
  template.duplicateSlots?.forEach(({ slot, photoIndex }) => {
    const photo = photoImages[photoIndex];
    if (photo) drawCoverInSlot(ctx, photo, slot, canvas.width, canvas.height);
  });
  // Transparent pixels reveal the photos; opaque pixels preserve all frame art.
  ctx.drawImage(templateImage, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.94);
}
