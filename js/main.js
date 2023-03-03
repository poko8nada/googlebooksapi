window.addEventListener('load', () => {

  const fetchBookData = async keyword => {
    const endPoint = 'https://www.googleapis.com/books/v1';
    const response = await fetch(`${endPoint}/volumes?q=${keyword}`);
    const data = await response.json();
    return data;
  };

  const buildBookObj = async data => {
    const books = await data.items.map(item => {
      let book = item.volumeInfo;
      return {
        id: book.industryIdentifiers[0].identifier,
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

  const getBooks = async keyword => {
    const data = await fetchBookData(keyword);
    const books = await buildBookObj(data);

    dataBaseFunc(books);

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
    list.innerHTML = listItems.join('');
  };

  const fadeIn = () => {
    const items = document.querySelectorAll('.item');
    for (let i = 0; i < items.length; i++) {
      setTimeout(() => {
        items[i].classList.remove('fade-in');
      }, 100 * (i - 1));
    }
  };

  const showBooks = async () => {
    const input = document.querySelector('input[name="search"]');
    const books = await getBooks(input.value);

    createDom(books);
    fadeIn();
  };
  // const showBooks = _.debounce(getBooks, 1000);

  const searchBooks = document.getElementById('search-books');
  searchBooks.addEventListener('submit', e => {
    e.preventDefault();
    showBooks();
  });
});
