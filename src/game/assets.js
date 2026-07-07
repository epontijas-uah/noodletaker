const PLAYER_SPRITES = {
  p1: {
    src: '/ninja1.png',
    frameWidth: 697,
    frameHeight: 1004,
    idleFrame: 3,
  },
  p2: {
    src: '/ninja2.png',
    frameWidth: 697,
    frameHeight: 1004,
    idleFrame: 3,
  },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

export async function loadGameAssets() {
  const [
    finishLine,
    p1Image,
    p2Image,
  ] = await Promise.all([
    loadImage('/finish.png'),
    loadImage(PLAYER_SPRITES.p1.src),
    loadImage(PLAYER_SPRITES.p2.src),
  ]);

  return {
    finishLine,
    players: {
      p1: { ...PLAYER_SPRITES.p1, image: p1Image },
      p2: { ...PLAYER_SPRITES.p2, image: p2Image },
    },
  };
}