// src/utils/cropImage.ts

// Тип из библиотеки react-easy-crop
interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  /**
   * Функция для обрезки изображения на Canvas по заданным координатам
   * и возвращения результата в виде объекта Blob (который можно отправить на сервер).
   */
  export const getCroppedImage = (imageSrc: string, crop: CropArea, rotation = 0): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
  
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
  
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        // Математика для учета поворота и размера исходного изображения
        const safeArea = Math.max(image.naturalWidth, image.naturalHeight) * 2;
  
        // Установка размера canvas с учетом поворота
        canvas.width = safeArea;
        canvas.height = safeArea;
  
        // Перемещение в центр, поворот
        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-safeArea / 2, -safeArea / 2);
  
        // Рисование изображения
        ctx.drawImage(
          image,
          safeArea / 2 - image.naturalWidth / 2,
          safeArea / 2 - image.naturalHeight / 2
        );
  
        const data = ctx.getImageData(
          crop.x * scaleX + safeArea / 2 - image.naturalWidth / 2,
          crop.y * scaleY + safeArea / 2 - image.naturalHeight / 2,
          crop.width * scaleX,
          crop.height * scaleY
        );
  
        // Установка canvas для обрезанного изображения
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
  
        // Очистка и отрисовка обрезанного фрагмента
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(data, 0, 0);
  
        // Получение Blob из Canvas
        canvas.toBlob((file) => {
          if (file) {
            resolve(file as Blob);
          } else {
            reject(new Error('Canvas to Blob failed'));
          }
        }, 'image/jpeg', 0.95); // Формат и качество
      };
      image.onerror = (error) => reject(error);
      image.src = imageSrc;
    });
  };