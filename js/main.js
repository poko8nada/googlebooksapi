window.addEventListener('load', () => {
  let startIndex = 0;
  const maxResults = {
    max: 40,
    min: 10,
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

  const buildBookObj = async data => {
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

  const openDB = async () => {
    const openRequest = indexedDB.open('booksData');

    openRequest.onupgradeneeded = e => {
      const db = e.target.result;
      db.createObjectStore('researchedBooks', { keyPath: 'id' });
    };
    return openRequest;
  };

  const prepareStore = async event => {
    let db = event.target.result;
    let trans = db.transaction('researchedBooks', 'readwrite');
    let store = trans.objectStore('researchedBooks');
    return store;
  };

  const addBooksToDB = async (books, startIndex) => {
    const openRequest = await openDB();

    openRequest.onsuccess = async function (event) {
      const store = await prepareStore(event);

      if (startIndex > 3 || startIndex === 0) {
        store.clear();
        console.log('store clear');
      }

      books.forEach(item => {
        let putRequest = store.put(item);
        putRequest.onsuccess = function () {
          console.log('正常にデータが追加されました。');
        };
        putRequest.onerror = function () {
          console.log('データの追加に失敗しました。');
        };
      });
    };

    openRequest.onerror = function () {
      console.log('DBへの接続に失敗しました。');
    };
  };

  const getBooks = async (keyword, maxResults, startIndex) => {
    const data = await fetchBookData(keyword, maxResults, startIndex);
    const books = await buildBookObj(data);

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

  const switchScrollText = () => {
    const scrollText = document.querySelectorAll('.scroll-text');
    scrollText.forEach(item => {
      item.classList.toggle('hide');
    });
  };

  const clearDom = () => {
    const scroll = document.querySelector('.scroll');
    scroll.classList.add('hide');

    switchScrollText();

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

  const mainSearch = document.querySelector('#main-search');
  mainSearch.addEventListener('submit', e => {
    e.preventDefault();

    const mainInput = document.querySelector('#main-search input');
    if (mainInput.value === '' || mainInput.value.match(/\s+/g)) {
      return false;
    }

    switchSearchBox();

    startIndex = 0;
    showBooksDom(mainInput.value, maxResults.min, startIndex);
    startIndex++;

    const headerInput = document.querySelector('#header-search input');
    headerInput.value = mainInput.value;

    console.log(startIndex);
  });

  const headerSearch = document.querySelector('#header-search');
  headerSearch.addEventListener('submit', e => {
    e.preventDefault();

    const headerInput = document.querySelector('#header-search input');
    if (headerInput.value === '' || headerInput.value.match(/\s+/g)) {
      return false;
    }

    clearDom();

    startIndex = 0;
    showBooksDom(headerInput.value, maxResults.min, startIndex);
    startIndex++;

    console.log(startIndex);
  });

  const scrollBtn = document.querySelector('.scroll a');
  scrollBtn.addEventListener('click', async () => {
    const headerInput = document.querySelector('#header-search input');
    await showBooksDom(headerInput.value, maxResults.max, startIndex);
    startIndex++;

    if (startIndex >= 3) {
      switchScrollText();
    }
    console.log(startIndex);
  });





});
