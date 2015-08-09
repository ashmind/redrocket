import 'whatwg-fetch';
import $ from 'jquery';
import moment from 'moment';

function getNewPosts(subreddit, limit) {
    return fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`)
        .then(r => r.json())
        .then(json => json.data.children.map(c => {
            let created = moment.unix(c.data.created_utc);
            return {
                title: c.data.title,
                score: c.data.score,
                commentCount: c.data.num_comments,
                created: created,
                age: moment.duration(moment.utc() - created),
                url: `https://www.reddit.com/${c.data.permalink}`
            };
        }));
}

function getAttention(post) {
    return (post.score - 1) / (
        (2.5 * Math.pow(2, post.age.asHours()))
        *
        (1 + Math.max(post.commentCount - 3, 0))
    );
}

function evaluatePosts(posts) {
    for (let post of posts) {
        post.attention = getAttention(post);
    }

    posts = posts.filter(p => p.attention >= 0.1);
    posts.sort((p1, p2) => {
        if (p1.attention > p2.attention)
            return -1;

        if (p1.attention < p2.attention)
            return 1;

        return 0;
    });
    return posts;
}

function render($ul, posts) {
    $ul.empty();
    for (let post of posts) {
        $ul.append(`<li class='post'>
          <div class='post-attention' title='${post.attention}'>${post.attention.toFixed(1)}</div>
          <div class='post-info'>
            <a href='${post.url}' class='post-title'>${post.title}</a>
            <div class='post-details'>
              <span>Scored ${post.score}</span>
              with
              <span>${post.commentCount} comments</span>
              <span>${post.age.humanize()} ago</span>
            </div>
          </div>
        </li>`);
    }
}

let notified = {};
function notify(posts) {
    if (Notification.permission === 'denied')
        return;

    if (Notification.permission !== 'granted') {
        Notification.requestPermission(permission => {
            if (permission === 'granted')
                notify(posts);
        });
    }

    for (let post of posts) {
        if (post.attention < 1)
            continue;

        if (notified[post.url] && notified[post.url] - post.attention < 1)
            continue;

        let notification = new Notification('RedRocket', {
            body: post.attention.toFixed(1) + ': ' + post.title
        });
        notified[post.url] = post.attention;
        notification.onclick = () => {
            window.open(post.url);
        };
    }
}

$(() => {
    let $ul = $('<ul>').appendTo($('body'));
    let update = () =>  getNewPosts('WritingPrompts', 50).then(posts => {
        posts = evaluatePosts(posts);
        render($ul, posts);
        notify(posts);
    });

    update();
    window.setInterval(update, 60 * 1000);
});