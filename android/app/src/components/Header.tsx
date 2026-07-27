import React from "react";

import {
    View,
    Text,
    StyleSheet
} from "react-native";

interface HeaderProps {
    online?: boolean;
}

export default function Header({ online = false }: HeaderProps) {

    return (

        <View style={styles.container}>

            <View style={styles.titleBlock}>

                <Text style={styles.title}>

                    RADARSUR

                </Text>

                <Text style={styles.subtitle}>

                    Sistema Inteligente de Búsqueda

                </Text>

            </View>

            <View style={styles.statusContainer}>

                <View style={[styles.dot, online ? styles.dotOnline : styles.dotOffline]}/>

                <Text style={[styles.online, online ? styles.textOnline : styles.textOffline]}>

                    {online ? "ONLINE" : "OFFLINE"}

                </Text>

            </View>

        </View>

    );

}

const styles = StyleSheet.create({

    container:{
        paddingHorizontal:16,
        paddingVertical:14,
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center",
        borderBottomWidth:1,
        borderBottomColor:"#2C3746",
        backgroundColor:"#111827"
    },

    titleBlock:{
        flex:1,
        marginRight:12
    },

    title:{
        color:"#00FF88",
        fontSize:24,
        fontWeight:"700"
    },

    subtitle:{
        color:"#A5B4C3",
        marginTop:4,
        fontSize:12
    },

    statusContainer:{
        flexDirection:"row",
        alignItems:"center",
        flexShrink:0
    },

    dot:{
        width:10,
        height:10,
        borderRadius:5,
        marginRight:8
    },
    dotOnline: {
        backgroundColor:"#00FF88"
    },
    dotOffline: {
        backgroundColor:"#64748B"
    },

    online:{
        fontWeight:"600"
    },
    textOnline: {
        color:"#00FF88"
    },
    textOffline: {
        color:"#94A3B8"
    }

});
