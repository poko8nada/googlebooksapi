window.addEventListener('load', () => {

  const input = document.getElementById('input');
  const keyword = 'webアプリケーション';
  const list = document.getElementById('list');
  console.log(input.value);

  const getBooks = async keyword => {
    const endPoint = 'https://www.googleapis.com/books/v1';

    const res = await fetch(`${endPoint}/volumes?q=${keyword}`);
    const data = await res.json();

    const books = data.items.map((item, index) => {
      let book = item.volumeInfo;
      return {
        id: index,
        title: book.title,
        description: book.description,
        infoLink: book.infoLink,
        imageLinks: book.imageLinks.thumbnail,
        publishedDate: book.publishedDate,
      };
    });
    return books;
  };

  const showBooks = async () => {
    let books = await getBooks(keyword);
    const listItems = books.map((item) => {
      return `
      <li class="item">
      <dl class="description">
        <dt><img src="${item.imageLinks}" width="120"></dt>
        <dd>
          <h3>${item.title}</h3>
          <p>${item.publishedDate}</p>
          <a href="${item.infoLink}" target="_blank">infoLink</a>
        </dd>
      </dl>
      </li>
      `;
    });
    list.innerHTML = listItems.join('');
  };
  // const showBooks = _.debounce(getBooks, 1000);

  showBooks();
});
