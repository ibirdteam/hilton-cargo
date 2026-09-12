(function ($) {
	"use strict";

/*=============================================
	=    		 Preloader			      =
=============================================*/
function preloader() {
	$('#preloader').delay(0).fadeOut();
};

$(window).on('load', function () {
	preloader();
	wowAnimation();
    aosAnimation();
});



/*===========================================
	=    		Mobile Menu			      =
=============================================*/
//SubMenu Dropdown Toggle
if ($('.tgmenu__wrap li.menu-item-has-children ul').length) {
	$('.tgmenu__wrap .navigation li.menu-item-has-children').append('<div class="dropdown-btn"><span class="plus-line"></span></div>');
}

//Mobile Nav Hide Show
if ($('.tgmobile__menu').length) {

	var mobileMenuContent = $('.tgmenu__wrap .tgmenu__main-menu').html();
	$('.tgmobile__menu .tgmobile__menu-box .tgmobile__menu-outer').append(mobileMenuContent);

	//Dropdown Button
	$('.tgmobile__menu li.menu-item-has-children .dropdown-btn').on('click', function () {
		$(this).toggleClass('open');
		$(this).prev('ul').slideToggle(300);
	});
	//Menu Toggle Btn
	$('.mobile-nav-toggler').on('click', function () {
		$('body').addClass('mobile-menu-visible');
	});

	//Menu Toggle Btn
	$('.tgmobile__menu-backdrop, .tgmobile__menu .close-btn').on('click', function () {
		$('body').removeClass('mobile-menu-visible');
	});
};



/*=============================================
	=           Data Background             =
=============================================*/
$("[data-background]").each(function () {
	$(this).css("background-image", "url(" + $(this).attr("data-background") + ")")
})



/*===========================================
	=     Menu sticky & Scroll to top      =
=============================================*/
$(window).on('scroll', function () {
	var scroll = $(window).scrollTop();
	if (scroll < 245) {
		$("#sticky-header").removeClass("sticky-menu");
		$('.scroll-to-target').removeClass('open');
        $("#header-fixed-height").removeClass("active-height");

	} else {
		$("#sticky-header").addClass("sticky-menu");
		$('.scroll-to-target').addClass('open');
        $("#header-fixed-height").addClass("active-height");
	}
});

/*===========================================
	   =         Sticky Menu     =
=============================================*/
function stickyHeader() {

    var $window = $(window);
    var lastScrollTop = 0;
    var $headerID = $('#sticky-header');
    var headerHeight = $headerID.outerHeight() + 30;

    $window.scroll(function () {
        var windowTop = $window.scrollTop();

        if (windowTop >= headerHeight) {
            $headerID.addClass('tg-sticky-menu');
        } else {
            $headerID.removeClass('tg-sticky-menu');
            $headerID.removeClass('sticky-menu__show');
        }

        if ($headerID.hasClass('tg-sticky-menu')) {
            if (windowTop < lastScrollTop) {
                $headerID.addClass('sticky-menu__show');
            } else {
                $headerID.removeClass('sticky-menu__show');
            }
        }

        lastScrollTop = windowTop;
    });
};
stickyHeader();

/*=============================================
	=    		 Scroll Up  	         =
=============================================*/
if ($('.scroll-to-target').length) {
  $(".scroll-to-target").on('click', function () {
    var target = $(this).attr('data-target');
    // animate
    $('html, body').animate({
      scrollTop: $(target).offset().top
    }, 1000);

  });
}


/*=============================================
	=            Header Search            =
=============================================*/
$(".search-open-btn").on("click", function () {
    $(".search__popup").addClass("search-opened");
    $(".search-popup-overlay").addClass("search-popup-overlay-open");
});
$(".search-close-btn").on("click", function () {
    $(".search__popup").removeClass("search-opened");
    $(".search-popup-overlay").removeClass("search-popup-overlay-open");
});


/*=============================================
=     Offcanvas Menu      =
=============================================*/
$(".menu-tigger").on("click", function () {
	$(".offCanvas__info, .offCanvas__overly").addClass("active");
	return false;
});
$(".menu-close, .offCanvas__overly").on("click", function () {
	$(".offCanvas__info, .offCanvas__overly").removeClass("active");
});

/*=============================================
	=          Slider active              =
=============================================*/
var swiper2 = new Swiper(".slider__active", {
    spaceBetween: 0,
    effect: "fade",
    loop: true,
    autoplay: {
        delay: 10000,
    },
});


/*=============================================
	=          Slider active              =
=============================================*/
var swiper2 = new Swiper(".slider__active-two", {
    spaceBetween: 0,
    effect: "fade",
    loop: true,
    autoplay: {
        delay: 10000,
    },
});


/*=============================================
	=          brand active              =
=============================================*/
var slider = new Swiper('.brand-active', {
    slidesPerView: 1,
    spaceBetween: 30,
    loop: true,
    breakpoints: {
        '1200': {
            slidesPerView: 6,
        },
        '992': {
            slidesPerView: 5,
        },
        '768': {
            slidesPerView: 4,
        },
        '576': {
            slidesPerView: 3,
        },
        '0': {
            slidesPerView: 2,
        },
    },
});


/*=============================================
	=          Project Active              =
=============================================*/
var projectSlider = new Swiper('.project-active', {
    slidesPerView: 3,
    spaceBetween: 24,
    centeredSlides: true,
    loop: true,
    breakpoints: {
        '1500': {
            slidesPerView: 3,
        },
        '1200': {
            slidesPerView: 3,
        },
        '992': {
            slidesPerView: 3,
        },
        '768': {
            slidesPerView: 3,
        },
        '576': {
            slidesPerView: 1.3,
        },
        '0': {
            slidesPerView: 1,
        },
    },
    pagination: {
      el: '.project__nav',
      clickable: true,
    },
});


/*=============================================
	=          Project Active              =
=============================================*/
var projectSlider = new Swiper('.project-active-two', {
    slidesPerView: 3,
    spaceBetween: 24,
    loop: true,
    breakpoints: {
        '1500': {
            slidesPerView: 3,
        },
        '1200': {
            slidesPerView: 3,
        },
        '992': {
            slidesPerView: 3,
        },
        '768': {
            slidesPerView: 2,
        },
        '576': {
            slidesPerView: 1,
        },
        '0': {
            slidesPerView: 1,
        },
    },
});


/*=============================================
	=          Project Active              =
=============================================*/
var projectSlider = new Swiper('.project-active-three', {
    slidesPerView: 4,
    spaceBetween: 24,
    loop: true,
    breakpoints: {
        '1500': {
            slidesPerView: 4,
        },
        '1200': {
            slidesPerView: 4,
        },
        '992': {
            slidesPerView: 3,
        },
        '768': {
            slidesPerView: 2,
        },
        '576': {
            slidesPerView: 1,
        },
        '0': {
            slidesPerView: 1,
        },
    },
});

/*=============================================
	=          testimonial active              =
=============================================*/
var swiper = new Swiper(".testimonial__nav", {
    spaceBetween: 0,
    slidesPerView: 4,
});
var swiper2 = new Swiper(".testimonial-active", {
    spaceBetween: 0,
    loop: true,
    autoplay: {
        delay: 6000,
    },
    thumbs: {
        swiper: swiper,
    },
    // Navigation arrows
    navigation: {
        nextEl: '.testimonial-button-next',
        prevEl: '.testimonial-button-prev',
    },
});


/*=============================================
	=        progress-bar	       =
=============================================*/
$('.progress-bar').waypoint(function() {
    $('.progress-bar').css({
    animation: "animate-positive 1.8s",
    opacity: "1"
    });
}, { offset: '75%' });

/*=============================================
	=        Counter Up 	       =
=============================================*/
$(".counter-number").counterUp({
    delay: 10,
    time: 1000,
});

/*===========================================
=         Marquee Active         =
=============================================*/
if ($(".marquee_mode").length) {
    $('.marquee_mode').marquee({
        speed: 35,
        gap: 0,
        delayBeforeStart: 0,
        direction: 'left',
        duplicated: true,
        pauseOnHover: true,
        startVisible:true,
    });
}


/*=============================================
	=    	 Slider Range Active             =
=============================================*/
$("#slider-range").slider({
	range: true,
	min: 0,
	max: 6000,
	values: [0, 3500],
	slide: function (event, ui) {
		$("#amount").val(ui.values[0] + " - " + ui.values[1] + " km");
	}
});
$("#amount").val($("#slider-range").slider("values", 0) +  " - " + $("#slider-range").slider("values", 1) + " km");

/*=============================================
	=    		Magnific Popup		      =
=============================================*/
$('.popup-image').magnificPopup({
	type: 'image',
	gallery: {
		enabled: true
	}
});

/* magnificPopup video view */
$('.popup-video').magnificPopup({
	type: 'iframe'
});


/*=============================================
	=    		 Wow Active  	         =
=============================================*/
function wowAnimation() {
	var wow = new WOW({
		boxClass: 'wow',
		animateClass: 'animated',
		offset: 0,
		mobile: false,
		live: true
	});
	wow.init();
}

/*=============================================
	=           Aos Active       =
=============================================*/
function aosAnimation() {
	AOS.init({
		duration: 1000,
		mirror: true,
		once: true,
		disable: 'mobile',
	});
}


})(jQuery);