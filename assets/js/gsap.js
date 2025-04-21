


//frontend text
const test = new Letterize({
    targets: ".front" 
});

const animation = anime.timeline({
    targets: test.listAll,
    delay: anime.stagger(50),
    loop: true
});

animation
    .add({
        translateY: -40
    });


