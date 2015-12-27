import 'whatwg-fetch';
import $ from 'jquery';
import moment from 'moment';
import TextIconGenerator from './TextIconGenerator';

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
                url: `https://www.reddit.com/${c.data.permalink}`,
                isModChoice: /(\s|^)mc($|\s)/.test(c.data.link_flair_css_class)
            };
        }));
}

function getAttention(post) {
    return (post.score - 1) / (2.5 * Math.pow(2.1, post.age.asHours())) -
           4 * Math.max(post.commentCount - 2, 0) / post.score;
}

function evaluatePosts(posts) {
    for (let post of posts) {
        post.attention = getAttention(post);
    }

    posts = posts.filter(p => p.attention >= 0.3);
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
        $ul.append(`<li class='post${post.isModChoice ? ' mod-choice' : ''}'>
          <div class='post-attention' title='${post.attention}'>${post.attention.toFixed(1)}</div>
          <div class='post-info'>
            <a href='${post.url}' class='post-title' target='_blank'>${post.title}</a>
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

let iconGenerator = new TextIconGenerator({
    size: 64,
    padding: 8,
    fontFamily: "'Open Sans', sans-serif"
});
let notified = {};
function notify(posts) {
    if (Notification.permission === 'denied')
        return;

    if (Notification.permission !== 'granted') {
        Notification.requestPermission(permission => {
            if (permission === 'granted')
                notify(posts);
        });
        return;
    }

    for (let post of posts) {
        if (post.attention < 1.0)
            continue;

        if (notified[post.url] && notified[post.url] - post.attention < 1)
            continue;

        let notification = new Notification('RedRocket', {
            body: post.title,
            icon: iconGenerator.generate(post.attention.toFixed(1), 'white', post.isModChoice ? '#e99e19' : '#af1313')
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