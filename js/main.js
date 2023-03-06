window.addEventListener('load', () => {
  let startIndex = 0;
  const maxResults = {
    max: 40,
    min: 30,
  };

  const fetchBookData = async (keyword, maxResults, startIndex) => {
    const endPoint = 'https://www.googleapis.com/books/v1';
    const response = await fetch(
      `${endPoint}/volumes?q=${keyword}&maxResults=${maxResults}&startIndex=${startIndex}`
    );
    const data = await response.json();
    console.log(startIndex);
    return data;
  };

  const buildBookObj = async (data, startIndex) => {
    let books = [];
    if (startIndex !== 0) {
      const listItems = document.querySelectorAll('.item');
      const itemsId = [];
      for (const item of listItems) {
        itemsId.push(item.dataset.id);
      }
      for (const item of data.items) {
        if (!itemsId.includes(item.id)) {
          books.push(item);
        }
      }
      console.log(books);
    } else {
      for (const item of data.items) {
        books.push(item);
      }
    }
    books = books.map(item => {
      let book = item.volumeInfo;
      return {
        id: item.id,
        title: book.title,
        subtitle: book.subtitle ? book.subtitle : '',
        description: book.description ? book.description : 'unknown',
        authors: book.authors ? book.authors : 'unknown',
        publisher: book.publisher ? book.publisher : 'unknown',
        infoLink: book.infoLink,
        imageLinks: book.imageLinks
          ? book.imageLinks.thumbnail
          : '/img/noimage.jpg',
        publishedDate: book.publishedDate,
      };
    });
    return books;
  };

  const openDB = () => {
    // Promiseで包んでハンドラの中で resolve ないし reject をしてあげるのがポイント。
    const database = new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('booksData');

      openRequest.onsuccess = e => resolve(e.target.result);
      openRequest.onerror = () => reject('fail to open');

      openRequest.onupgradeneeded = e => {
        const db = e.target.result;
        db.createObjectStore('researchedBooks', { keyPath: 'id' });
      };
    });
    return database;
  };

  const addBooksToDB = async (books, startIndex) => {
    const database =  await openDB();

    // Promiseで包んでハンドラの中で resolve ないし reject をしてあげるのがポイント。
    return new Promise((resolve, ) => {
  
      const trans = database.transaction('researchedBooks', 'readwrite');
      const store = trans.objectStore('researchedBooks');
      
      if (startIndex > 3 || startIndex === 0) {
        store.clear();
        console.log('store clear');
      }
      
      books.forEach(item => {
        const putRequest = store.put(item);
        putRequest.onsuccess = function () {
          resolve(item);
        };
        putRequest.onerror = function () {
          reject;
        };
      });
    });
  };

  const getDataFromDB = async (id) => {
    const database =  await openDB();

    // Promiseで包んでハンドラの中で resolve ないし reject をしてあげるのがポイント。
    return new Promise((resolve, reject) => {

      const trans = database.transaction('researchedBooks', 'readonly');
      const store = trans.objectStore('researchedBooks');

      const getRequest = store.get(id);

      getRequest.onsuccess = e => {
        resolve(e.target.result);
      };

      getRequest.onerror = reject;
  });
  
};

  const getBooks = async (keyword, maxResults, startIndex) => {
    const data = await fetchBookData(keyword, maxResults, startIndex);
    const books = await buildBookObj(data, startIndex);

    addBooksToDB(books, startIndex);

    return books;
  };

  const createDom = books => {
    const list = document.getElementById('list');
    const listItems = books.map(item => {
      return `
      <li class="item fade-in" data-id="${item.id}">
      <dl class="description">
      <dt><img src="${item.imageLinks}" width="120"></dt>
      <dd>
      <h3>${item.title}</h3>
      <p>${item.subtitle}</p>
      <p class="published-date">出版年月: ${item.publishedDate}</p>
      </dd>
      </dl>
      </li>
      `;
    });
    // list.innerHTML = listItems.join('');
    list.insertAdjacentHTML('beforeend', listItems.join(''));
  };

  const fadeIn = async () => {
    let i = 0;
    const items = document.querySelectorAll('.fade-in');
    for await (let item of items) {
      i++;
      setTimeout(() => {
        item.classList.remove('fade-in');
      }, 20 * i);
    }

    const scroll = document.querySelector('.scroll');
    setTimeout(() => {
      scroll.classList.remove('hide');
    }, 20);
  };

  const switchScrollText = startIndex => {
    const scrollBtn = document.querySelector('.scroll-btn');
    const scrollText = document.querySelector('.scroll-text');
    if(startIndex < 2 ){
      scrollBtn.classList.remove('hide');
      scrollText.classList.add('hide');
    }else{
      scrollBtn.classList.add('hide');
      scrollText.classList.remove('hide');
    }
  };

  const clearDom = () => {
    const scroll = document.querySelector('.scroll');
    scroll.classList.add('hide');

    const list = document.getElementById('list');
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
  };

  const switchSearchBox = () => {
    const search = document.querySelectorAll('.search');
    search.forEach(item => {
      item.classList.toggle('hide');
    });

    const h1 = document.querySelector('h1');
    h1.classList.add('hide');
  };

  const showBooksDom = async (value, maxResults, startIndex) => {
    const books = await getBooks(value, maxResults, startIndex);

    createDom(books);
    fadeIn();
  };
  // const showBooks = _.debounce(getBooks, 1000);

  const createModal = (bookData) => {
    const modalDom = `
    <dl class="description">
      <dt><img src="${bookData.imageLinks}"></dt>
      <dd>
      <h4>${bookData.title}</h4>
      <p>${bookData.subtitle}</p>
      <p class="author">著者: ${bookData.authors} / 出版社: ${bookData.publisher}</p>
      <p>${bookData.description}</p>
      <p><a href="${bookData.infoLink}" target="_blank">google booksへのリンク</a></p>
      <p class="published-date">出版年月: ${bookData.publishedDate}</p>
      </dd>
    </dl>
    `;
    document.body.style.overflow = 'hidden';
    const modal = document.querySelector('#modal');
    modal.innerHTML = modalDom;

    const top = window.pageYOffset;
    const modalWrapper = document.querySelector('.modal-wrapper');
    modalWrapper.style.top = top + 'px';

    modalWrapper.classList.remove('hide');
  };

  const mainSearch = document.querySelector('#main-search');
  mainSearch.addEventListener('submit', e => {
    e.preventDefault();

    const mainInput = document.querySelector('#main-search input');
    if (mainInput.value === '' || mainInput.value.match(/^\s+/g)) {
      return;
    }

    switchSearchBox();

    startIndex = 0;
    showBooksDom(mainInput.value, maxResults.min, startIndex);
    startIndex++;

    const headerInput = document.querySelector('#header-search input');
    headerInput.value = mainInput.value;

  });

  const headerSearch = document.querySelector('#header-search');
  headerSearch.addEventListener('submit', e => {
    e.preventDefault();

    const headerInput = document.querySelector('#header-search input');
    if (headerInput.value === '' || headerInput.value.match(/^\s+/g)) {
      return;
    }

    clearDom();

    startIndex = 0;
    switchScrollText(startIndex);
    showBooksDom(headerInput.value, maxResults.min, startIndex);
    startIndex++;

    console.log(startIndex);
  });

  const scrollBtn = document.querySelector('.scroll a');
  scrollBtn.addEventListener('click', async () => {
    const headerInput = document.querySelector('#header-search input');
    await showBooksDom(headerInput.value, maxResults.max, startIndex);
    startIndex++;

    switchScrollText(startIndex);
  });

  const list = document.getElementById('list');
  list.addEventListener('click',  async e => {
    if (e.target === e.currentTarget) {
      return;
    }
    const id =  await e.target.closest('.item').dataset.id;
    const bookData = await getDataFromDB(id);
    
    createModal(bookData);
  });


  const closeBtn = document.querySelector('.close-btn');
  closeBtn.addEventListener('click', ()=> {

    document.body.style.overflow = 'auto';

    const modalWrapper = document.querySelector('.modal-wrapper');
    modalWrapper.classList.add('hide');
  });
});
