<template>
  <q-layout>
    <div class="container">
      <!-- Navigation -->
      <div :class="{ navigation: true, active: isNavActive }">
        <ul>
          <li
            v-for="(item, index) in navItems"
            :key="index"
            :class="{ hovered: hoveredIndex === index }"
            @mouseover="setHoveredIndex(index)"
          >
            <a href="#" @click.prevent="goto(item.to)">
              <span class="icon">
                <template v-if="item.src">
                  <img :src="item.src" style="height:40%; background:white;border-radius:5rem;padding:2px;" />
                </template>
                <template v-else>
                  <q-icon :name="item.icon"></q-icon>
                </template>
              </span>
              <span class="title">{{ item.title }}</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Main Section -->
      <div :class="{ main: true, active: isNavActive }">
        <div class="topbar">
          <div class="toggle" @click="toggleNav">
            <q-icon name="ion-menu"></q-icon>
          </div>

          <div class="user">
            <img src="customer01.jpg" alt="" />
          </div>
        </div>
        <!-- Your content goes here -->
        <q-page-container>
          <q-page>
            <router-view />
          </q-page>
        </q-page-container>
      </div>
    </div>
  </q-layout>
</template>

<script>
export default {
  name: "MyLayout",
  data() {
    return {
      isNavActive: false,
      hoveredIndex: null,
      navItems: [
        { title: "FreeThinkers", icon: "ion-logo-apple", src: "/img/logo.png"},
        { title: "Dashboard", icon: "ion-home",to:'/dashboard' },
        { title: "Maps", icon: "ion-map" ,to:'/dashboard/maps'},
        { title: "Pending Potholes", icon: "ion-clock" ,to:'/dashboard/notfixed' },
        { title: "FLowmeter Analysis", icon: "ion-analytics" ,to:"/dashboard/flowanalysis"},
        { title: "Flowmeter Data", icon: "ion-trending-up" ,to:'/dashboard/flowdata'},
        { title: "Sign Out", icon: "ion-log-out",to:'/' },
      ],
    };
  },
  methods: {
    toggleNav() {
      this.isNavActive = !this.isNavActive;
    },
    setHoveredIndex(index) {
      this.hoveredIndex = index;
    },
    goto(route) {
      this.isNavActive = !this.isNavActive;
      this.$router.push(route);
    }
  },
};
</script>

<style scoped></style>
