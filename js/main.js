window.addEventListener('load', () => {

  let startIndex = 0;
  const fetchBookData = async (keyword, startIndex) => {
    const endPoint = 'https://www.googleapis.com/books/v1';
    const response = await fetch(
      `${endPoint}/volumes?q=${keyword}&maxResults=20&startIndex=${startIndex}`
    );
    const data = await response.json();
    return data;
  };

  const buildBookObj = async data => {
    const books = await data.items.map(item => {
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

  const dataBaseFunc = books => {
    const openRequest = indexedDB.open('booksData');

    openRequest.onupgradeneeded = e => {
      const db = e.target.result;
      db.createObjectStore('researchedBooks', { keyPath: 'id' });
    };

    openRequest.onsuccess = function (event) {
      //DB作成or接続が成功した時
      console.log('DBへの接続が成功しました');

      let db = event.target.result;
      //ここからオブジェクトストアに情報を{キー: 値・・・}の形で入れる処理。
      let trans = db.transaction('researchedBooks', 'readwrite');
      let store = trans.objectStore('researchedBooks');

      store.clear();

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

  const getBooks = async (keyword, startIndex) => {
    const data = await fetchBookData(keyword, startIndex);
    const books = await buildBookObj(data);

    // dataBaseFunc(books);

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
    for await (let item of items){
      i++;
      setTimeout(() => {
        item.classList.remove('fade-in');
      }, 20 * i);
    }

    const scroll = document.querySelector('.scroll');
    setTimeout(()=>{
      scroll.classList.remove('hide');
    }, 20)
  };

  const clearDom = () =>{
    const scroll = document.querySelector('.scroll');
    scroll.classList.add('hide');

    const list = document.getElementById('list');
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
  };

  const showBooks = async () => {
    const input = document.querySelector('input[name="search"]');
    const books = await getBooks(input.value, startIndex);

    createDom(books);
    fadeIn();
    startIndex++;

  };
  // const showBooks = _.debounce(getBooks, 1000);

  const searchBox = document.getElementById('search-box');
  searchBox.addEventListener('submit', e => {
    e.preventDefault();

    clearDom();

    startIndex = 0;
    showBooks();
  });

  const scrollBtn = document.querySelector('.scroll');
  scrollBtn.addEventListener('click', () => {
    showBooks();
  });
});
